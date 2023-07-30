// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt

let default_company = frappe.defaults.get_user_default("company");
console.log(default_company);
frappe.listview_settings['Scale Item'] = {
    hide_name_column: true,
    has_indicator_for_draft: true,
    filters: [["company", "=", default_company]],
	get_indicator: function (doc) {
	    
	    if (doc.docstatus === 'Cancelled'){
            return [__("9 已取消"), "red", "status,=,9 已取消"];
        } else if (doc.status === "0 新配") {
            return [__("0 新配"), "light blue", "status,=,0 新配"];
        } else if (doc.status === "1 已配罐") {
            return [__("1 已配罐"), "blue", "status,=,1 已配罐"];
        } else if (doc.status === "2 正在装货") {
            return [__("2 正在装货"), "orange", "status,=,2 正在装货"];
        } else if (doc.status === "3 已装货") {
            return [__("3 已装货"), "yellow", "status,=,3 已装货"];
        } else if (doc.status === "4 正在卸货") {
            return [__("4 正在卸货"), "cyan", "status,=,4 正在卸货"];
        } else if (doc.status === "5 已卸货") {
            return [__("5 已卸货"), "green", "status,=,5 已卸货"];
        } else if (doc.status === "6 已完成") {
            return [__("6 已完成"), "grey", "status,=,6 已完成"];
        } else if (doc.status === "9 已取消" || doc.docstatus=== 2) {
            return [__("9 已取消"), "red", "status,=,9 已取消"];
        } 
    }
};



