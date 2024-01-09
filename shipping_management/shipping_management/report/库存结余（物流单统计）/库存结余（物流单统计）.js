// Copyright (c) 2024, Alvin and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["库存结余（物流单统计）"] = {
	"filters": [
		{
			"fieldname": "company",
			"fieldtype": "Link",
			"label": "\u516c\u53f8",
			"mandatory": 0,
			"options": "Company",
			"wildcard_filter": 0
		   },
		   {
			"fieldname": "warehouse",
			"fieldtype": "Link",
			"label": "\u5e93\u4f4d",
			"mandatory": 0,
			"options": "Warehouse",
			"wildcard_filter": 0
		   },
		   {
			"fieldname": "item",
			"fieldtype": "Link",
			"label": "\u7269\u6599",
			"mandatory": 0,
			"options": "Item",
			"wildcard_filter": 0
		   }

	]
};
