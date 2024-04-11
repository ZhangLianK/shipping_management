// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt

frappe.ui.form.on('Scale List', {
	refresh: function (frm) {
		//add custom button to open the report scale_list_report with filter doc.name
		frm.add_custom_button(__('Scale List Export'), function () {
			//download all the child table info of this doc into excel
			frappe.call({
				method: 'shipping_management.shipping_management.doctype.scale_list.scale_list.generate_and_download',
				args: {
					scale_list: frm.doc.name,
					date: frm.doc.date,
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
		}
		);

	},
	get_scale_list_item: function (frm) {
		frappe.call({
			method: "shipping_management.shipping_management.doctype.scale_list.scale_list.get_scale_list_items",
			args: {
				"ship_plan": frm.doc.ship_plan,
			},
			callback: function (r) {
				if (r.message.length > 0) {
					frm.clear_table("items");
					$.each(r.message, function (i, d) {
						var row = frappe.model.add_child(frm.doc, "Scale List Items", "items");
						row.scale_item = d.name;
						row.item = d.item;
						row.vehicle = d.vehicle;
						row.driver = d.driver;
						row.driver_id = d.driver_id;
						row.phone = d.phone;
						row.qty = d.qty;
						row.repeat = d.repeat;
						row.license_number = d.license_number;
		    			row.yayun = d.yayun;
						row.yayun_cell_phone = d.yayun_cell_number;
						row.yayun_pid = d.yayun_pid;
						row.guahao = d.guahao;
						row.transport_license_number = d.transport_license_number;
						row.zhoushu	 = d.zhoushu;
					});
					frm.refresh_field("items");
				}
				else {
					//chinese message
					frappe.msgprint("未找到符合报号条件的物流单!");
				}
			}
		});
	},
	purchase_order: function (frm) {
		frappe.db.get_doc("Purchase Order", frm.doc.purchase_order).then(doc => {
			frm.set_value("item", doc.items[0].item_code);
			frm.refresh_field("item");
		});
	},
});


//when add row in the items and input scale_item, then auto fill the other fields
frappe.ui.form.on('Scale List Items', {
	scale_item: function (frm, cdt, cdn) {
		var row = locals[cdt][cdn];
		frappe.db.get_doc("Scale Item", row.scale_item).then(doc => {
			frappe.model.set_value(cdt, cdn, "item", doc.item);
			frappe.model.set_value(cdt, cdn, "vehicle", doc.vehicle);

			frappe.model.set_value(cdt, cdn, "phone", doc.phone);
			frappe.model.set_value(cdt, cdn, "qty", doc.target_weight);

			frappe.db.get_doc("Driver", doc.driver).then(doc => {
				frappe.model.set_value(cdt, cdn, "driver", doc.full_name);
				frappe.model.set_value(cdt, cdn, "driver_id", doc.pid);
				frappe.model.set_value(cdt, cdn, "phone", doc.cell_number);
			}
			);
		});
	}
});