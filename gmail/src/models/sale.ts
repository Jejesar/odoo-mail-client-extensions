import { URLS } from "src/const";
import { getAccessToken } from "src/services/odoo_auth";
import { jsonRpc } from "src/utils/http";

export class Sale {
    id: number;
    name: string;
    date_order: string;

    static createSale(partnerId: number, emailSubject: string, emailBody: string) {
        const url = PropertiesService.getUserProperties().getProperty("ODOO_SERVER_URL") + URLS.CREATE_SALE;
        const accessToken = getAccessToken();

        var response = jsonRpc(
            url,
            { partner_id: partnerId, email_subject: emailSubject, email_body: emailBody },
            { Authorization: "Bearer " + accessToken },
        );

        var saleId = JSON.parse(response.getContentText()).result || null;

        return saleId.sale_id;
    }

    static fromJson(values: any): Sale {
        const sale = new Sale();
        sale.id = values.id;
        sale.name = values.name;
        sale.date_order = values.date_order;
        return sale;
    }

    static fromOdooResponse(values: any): Sale {
        const sale = new Sale();
        sale.id = values.id;
        sale.name = values.name;
        sale.date_order = values.date_order;
        return sale;
    }
}
