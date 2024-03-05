// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt

frappe.ui.form.on('Ship Plan', {
	refresh: function(frm) {
		// Setting a query for the Sales Order field within the Ship Plan Item child table
        frm.set_query('sales_order', 'plan_items', function(doc, cdt, cdn) {
            // You can access the child document if needed
            var child = locals[cdt][cdn];
            // Returning an object with filters for the Sales Order field
            return {
                filters: {
                    'docstatus': 1, // Example: Only show submitted Sales Orders
                    'status': ['not in', ['Completed','Closed']], // Filtering by status
                    'company': frm.doc.company // Assuming the Ship Plan has a 'company' field and you want to match it
                }
            };
		});
	},
	from_addr: function(frm) {
		if (!frm.doc.from_addr) {
			frm.set_value('plan_desc', frm.doc.from_addr);
			frm.refresh_field('plan_desc');
		}
		
	},
});
