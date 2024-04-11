// Copyright (c) 2024, Alvin and contributors
// For license information, please see license.txt
/* eslint-disable */

let now = new Date();
now.setDate(now.getDate() - 1);
yesterday_dt = frappe.datetime.get_datetime_as_string(now);
one_month_ago = frappe.datetime.add_months(now, -1);
$('.container').css("max-width", "100%")


frappe.query_reports["物流明细报告"] = {
	"filters": [
		{
			"fieldname": "company",
			"fieldtype": "Link",
			"label": "\u516c\u53f8",
			"mandatory": 1,
			"options": "Company",
			"wildcard_filter": 0,
			"default": frappe.defaults.get_user_default("company")

		},
		{
			"fieldname": "market_segment",
			"fieldtype": "Link",
			"label": "\u4e8b\u4e1a\u90e8",
			"mandatory": 0,
			"options": "Market Segment",
			"wildcard_filter": 0,
			"default": frappe.defaults.get_user_default("market_segment")
		},
		{
			"fieldname": "ship_plan",
			"fieldtype": "Link",
			"label": "\u7269\u6d41\u8ba1\u5212",
			"mandatory": 0,
			"options": "Ship Plan",
			"wildcard_filter": 0
		},
		{
			"fieldname": "vehicle_plan",
			"fieldtype": "Link",
			"label": "\u914d\u8f66\u8ba1\u5212",
			"mandatory": 0,
			"options": "Vehicle Plan Item",
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
			"fieldname": "vehicle",
			"fieldtype": "Link",
			"label": "\u8f66\u53f7",
			"mandatory": 0,
			"wildcard_filter": 0,
			"options": "Vehicle"
		},
		{
			"fieldname": "status",
			"fieldtype": "Select",
			"label": "\u8f66\u8f86\u72b6\u6001",
			"mandatory": 0,
			"options": "\n0 \u65b0\u914d\n1 \u5df2\u914d\u7f50\n2 \u6b63\u5728\u88c5\u8d27\n3 \u5df2\u88c5\u8d27\n4 \u6b63\u5728\u5378\u8d27\n5 \u5df2\u5378\u8d27\n6 \u5df2\u5b8c\u6210\n9 \u5df2\u53d6\u6d88",
			"wildcard_filter": 0
		},
		{
			"fieldname": "bill_type",
			"fieldtype": "Data",
			"label": "\u81ea\u63d0/\u9001\u5230",
			"width": 0,
			"wildcard_filter": 0
		}
	]
};
