// Copyright (c) 2024, Alvin and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Ship List"] = {
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
		} ,
	    // {
		// 	"allow_on_submit": 1,
		// 	"depends_on": "eval: doc.type == 'OUT' || doc.type == 'DIRC'",
		// 	"fieldname": "bill_type",
		// 	"fieldtype": "Link",
		// 	"in_standard_filter": 1,
		// 	"label": "\u7ed3\u7b97\u7c7b\u578b",
		// 	"mandatory_depends_on": "eval: doc.type == 'OUT' || doc.type == 'DIRC'",
		// 	"options": "Scale Type",
		// 	"wildcard_filter": 0
		// }
		

	]
};
