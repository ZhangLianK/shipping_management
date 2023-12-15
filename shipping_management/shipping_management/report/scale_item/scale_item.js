// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Scale Item"] = {
	"filters": [
		{
			"fieldname": "company",
			"fieldtype": "Link",
			"label": "\u516c\u53f8",
			"mandatory": 1,
			"options": "Company",
			"wildcard_filter": 0
		},
		{
			"fieldname": "transporter",
			"fieldtype": "Link",
			"label": "\u627f\u8fd0\u5546",
			"mandatory": 0,
			"options": "Supplier",
			"wildcard_filter": 0
		},
		{
			"fieldname": "date",
			"fieldtype": "Date",
			"label": "\u8ba1\u5212\u65e5\u671f",
			"mandatory": 0,
			"wildcard_filter": 0
		},
		{
			"fieldname": "vehicle",
			"fieldtype": "Link",
			"label": "\u8f66\u53f7",
			"mandatory": 0,
			"wildcard_filter": 0
		},
		{
			"fieldname": "status",
			"fieldtype": "Select",
			"label": "\u8f66\u8f86\u72b6\u6001",
			"mandatory": 0,
			"options": "0 \u65b0\u914d\n1 \u5df2\u914d\u7f50\n2 \u6b63\u5728\u88c5\u8d27\n3 \u5df2\u88c5\u8d27\n4 \u6b63\u5728\u5378\u8d27\n5 \u5df2\u5378\u8d27\n6 \u5df2\u5b8c\u6210\n9 \u5df2\u53d6\u6d88",
			"wildcard_filter": 0
		},
		{
			"fieldname": "purchase_order",
			"fieldtype": "Link",
			"label": "\u91c7\u8d2d\u8ba2\u5355",
			"mandatory": 0,
			"options": "Purchase Order",
			"wildcard_filter": 0
		},
		{
			"fieldname": "sales_order",
			"fieldtype": "Link",
			"label": "\u9500\u552e\u8ba2\u5355",
			"mandatory": 0,
			"options": "Sales Order",
			"wildcard_filter": 0
		},
		{
			"fieldname": "sales_invoice",
			"fieldtype": "Link",
			"label": "\u9500\u552e\u8d39\u7528\u6e05\u5355",
			"mandatory": 0,
			"options": "Sales Invoice",
			"wildcard_filter": 0
		},
		{
			"fieldname": "ship_plan",
			"fieldtype": "Link",
			"label": "\u7269\u6d41\u8ba1\u5212",
			"mandatory": 0,
			"options": "Ship Plan",
			"wildcard_filter": 0
		}
	]
};
