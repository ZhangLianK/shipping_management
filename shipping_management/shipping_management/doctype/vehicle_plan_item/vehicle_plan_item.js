// Copyright (c) 2024, Alvin and contributors
// For license information, please see license.txt

frappe.ui.form.on('Vehicle Plan Item', {
	refresh: function(frm) {
		frm.set_query('transporter', function (doc) {
			return {
				filters: {
					'is_transporter': 1
				}
			};
		});
		//add a customer button to download all the scale items linked to this vehicle plan
		frm.add_custom_button(__('下载报号列表'), function () {
			frappe.call({
				method: 'shipping_management.shipping_management.doctype.vehicle_plan_item.vehicle_plan_item.generate_and_download_vehicle_plan_excel',
				args: {
					vehicle_plan: frm.doc.name
				},
				callback: function (r) {
					if (r.message) {
						var file_url = r.message;
						// Create a temporary invisible <a> element
						var tempLink = document.createElement('a');
						tempLink.href = file_url;
						// The download attribute specifies that the target will be downloaded when a user clicks on the hyperlink
						tempLink.setAttribute('download', '');
						tempLink.style.display = 'none';
						document.body.appendChild(tempLink);
						// Programmatically click the link to trigger the download
						tempLink.click();
						// Remove the temporary link from the document
						document.body.removeChild(tempLink);
					}
				}
			});
		});

		//add a customer button to create a new scale item
		frm.add_custom_button(__('新建物流单'), function () {
			frappe.route_options = {
				"vehicle_plan": frm.doc.name,
				"from_addr": frm.doc.from_addr,
				"transporter": frm.doc.transporter,
				"date": frm.doc.date,
				"type": 'OTH'
			};
			frappe.new_doc('Scale Item');
		} );
		
	},
	from_addr: function (frm) {
		frm.set_value('plan_desc', frm.doc.from_addr + frm.doc.req_qty);
	},
	req_qty: function (frm) {
		frm.set_value('plan_desc', frm.doc.from_addr + frm.doc.req_qty);
	},
});
