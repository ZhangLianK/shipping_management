// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt
/* eslint-disable */
let now = new Date();
now.setDate(now.getDate()-1);
yesterday_dt = frappe.datetime.get_datetime_as_string(now);
one_month_ago = frappe.datetime.add_months(now, -1);
$('.container').css("max-width","100%")

frappe.query_reports["Scale Item"] = {
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
			"fieldname": "date_from",
			"fieldtype": "Date",
			"label": "\u8ba1\u5212\u65e5\u671f\u5f00\u59cb",
			"mandatory": 0,
			"wildcard_filter": 0,
			"default": one_month_ago
		   },
		   {
			"fieldname": "date_to",
			"fieldtype": "Date",
			"label": "\u8ba1\u5212\u65e5\u671f\u7ed3\u675f",
			"mandatory": 0,
			"wildcard_filter": 0,
			"default": frappe.datetime.now_date()
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
			"fieldname": "ship_plan",
			"fieldtype": "Link",
			"label": "\u7269\u6d41\u8ba1\u5212",
			"mandatory": 0,
			"options": "Ship Plan",
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
			"fieldname": "pot",
			"fieldtype": "Link",
			"label": "\u7f50\uff08\u5e93\u4f4d\uff09",
			"mandatory": 0,
			"options": "Warehouse",
			"wildcard_filter": 0
		   },
		{
			"fieldname": "stock_dt_from",
			"fieldtype": "Datetime",
			"label": "\u5165\u51fa\u5e93\u65f6\u95f4\u5f00\u59cb",
			"mandatory": 0,
			"wildcard_filter": 0
		   },
		   {
			"fieldname": "stock_dt_to",
			"fieldtype": "Datetime",
			"label": "\u5165\u51fa\u5e93\u65f6\u95f4\u7ed3\u675f",
			"mandatory": 0,
			"wildcard_filter": 0,
			"default": frappe.datetime.now_datetime()
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
				"options": "\n0 \u65b0\u914d\n1 \u5df2\u914d\u7f50\n2 \u6b63\u5728\u88c5\u8d27\n3 \u5df2\u88c5\u8d27\n4 \u6b63\u5728\u5378\u8d27\n5 \u5df2\u5378\u8d27\n6 \u5df2\u5b8c\u6210\n9 \u5df2\u53d6\u6d88",
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
			   }
	]
};
