// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt

frappe.ui.form.on('Ship Plan', {
	// refresh: function(frm) {

	// }
	from_addr: function(frm) {
		if (!frm.doc.from_addr) {
			frm.set_value('plan_desc', frm.doc.from_addr);
			frm.refresh_field('plan_desc');
		}
		
	},
});
