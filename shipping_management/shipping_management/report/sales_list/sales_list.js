// Copyright (c) 2024, Alvin and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Sales List"] = {
	"filters": [
		{
			"fieldname": "name",
			"fieldtype": "Link",
			"label": "\u5355\u53f7",
			"options": "Scale Item",
			"wildcard_filter": 0
		},
		{
			"fieldname": "type",
			"fieldtype": "Link",
			"label": "\u7c7b\u578b",
			"mandatory": 0,
			"options": "Ship Type",
			"wildcard_filter": 0
		},
		{
			"fieldname": "status",
			"fieldtype": "Data",
			"label": "\u72b6\u6001",
			"wildcard_filter": 0
		},
		{
			"fieldname": "sales_order",
			"fieldtype": "Link",
			"label": "\u9500\u552e\u8ba2\u5355",
			"options": "Sales Order",
			"width": 0
		   },
		   {
			"fieldname": "sales_invoice",
			"fieldtype": "Link",
			"label": "\u9500\u552e\u8d39\u7528\u6e05\u5355",
			"options": "Sales Invoice",
			"width": 0
		   },
		   {
			"fieldname": "delivery_note",
			"fieldtype": "Link",
			"label": "\u9500\u552e\u51fa\u8d27\u5355",
			"options": "Delivery Note",
			"width": 0
		   },
	]
};
