import { Sale } from "src/models/sale";
import { State } from "../models/state";
import { getOdooServerUrl } from "../services/app_properties";
import { _t } from "../services/translation";
import { actionCall, createKeyValueWidget, notify, openUrl, updateCard } from "./helpers";
import { logEmail } from "../services/log_email";
import { buildView } from ".";
import { UI_ICONS } from "./icons";

function onLogEmailOnSale(state: State, parameters: any) {
    const saleId = parameters.saleId;

    if (State.checkLoggingState(state.email.messageId, "sales", saleId)) {
        state.error = logEmail(saleId, "sale.order", state.email);
        if (!state.error.code) {
            State.setLoggingState(state.email.messageId, "sales", saleId);
        }
        return updateCard(buildView(state));
    }
    return notify(_t("Email already logged on the sale"));
}

function onEmailAlreadyLoggedOnSale(state: State) {
    return notify(_t("Email already logged on the sale"));
}

function onCreateSale(state: State) {
    const saleId = Sale.createSale(state.partner.id, state.email.subject, state.email.body);

    if (!saleId) {
        return notify("Could not create the sale");
    }
    const cids = state.odooCompaniesParameter;
    const leadUrl =
        PropertiesService.getUserProperties().getProperty("ODOO_SERVER_URL") +
        `/web#id=${saleId}&model=sale.order&view_type=form&cids=${cids}`;

    return openUrl(leadUrl);
}

export function buildSalesView(state: State, card: Card) {
    const odooServerUrl = getOdooServerUrl();
    const partner = state.partner;
    const sales = partner.sales;

    const loggingState = State.getLoggingState(state.email.messageId);

    const salesSection = CardService.newCardSection().setHeader("<b>" + _t("Sale orders (%s)", sales.length) + "</b>");

    const cids = state.odooCompaniesParameter;

    if (state.partner.id) {
        salesSection.addWidget(
            CardService.newTextButton().setText(_t("Create")).setOnClickAction(actionCall(state, onCreateSale.name)),
        );

        for (let sale of sales) {
            let saleButton = null;
            if (loggingState["sales"].indexOf(sale.id) >= 0) {
                saleButton = CardService.newImageButton()
                    .setAltText(_t("Email already logged on the sale order"))
                    .setIconUrl(UI_ICONS.email_logged)
                    .setOnClickAction(actionCall(state, onEmailAlreadyLoggedOnSale.name));
            } else {
                saleButton = CardService.newImageButton()
                    .setAltText(_t("Log the email on the sale order %s", sale.id))
                    .setIconUrl(UI_ICONS.email_in_odoo)
                    .setOnClickAction(actionCall(state, onLogEmailOnSale.name, { saleId: sale.id }));
            }

            salesSection.addWidget(
                createKeyValueWidget(
                    null,
                    sale.name,
                    null,
                    sale.date_order,
                    saleButton,
                    odooServerUrl + `/web#id=${sale.id}&model=sale.order&view_type=form&cids=${cids}`,
                ),
            );
        }
    } else if (state.canCreatePartner) {
        salesSection.addWidget(CardService.newTextParagraph().setText(_t("Save Contact to create new Opportunities.")));
    } else {
        salesSection.addWidget(
            CardService.newTextParagraph().setText(_t("You can only create opportunities for existing customers.")),
        );
    }

    card.addSection(salesSection);
    return card;
}
