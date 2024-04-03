// Copyright (c) 2024, Alvin and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Weight List"] = {
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
			"fieldname": "vehicle",
			"fieldtype": "Link",
			"label": "\u8f66\u53f7",
			"mandatory": 0,
			"wildcard_filter": 0
		},
		{
			"fieldname": "stock_dt",
			"fieldtype": "Datetime",
			"label": "\u5165\u51fa\u5e93\u65f6\u95f4",
			"width": 0
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
	]
};
