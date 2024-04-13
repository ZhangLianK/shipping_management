// Copyright (c) 2024, Alvin and contributors
// For license information, please see license.txt

frappe.ui.form.on('Scale Item Creator', {
	// refresh: function(frm) {

	// }
	recognize: function (frm) {
		frappe.call({
			method: "ali_dashscope.ali_dashscope.dashscope.dashscope.recoginize_vehicle",
			args: {
				text: frm.doc.vehicle_text
			},
			callback: function (r) {
				//create a dilog to show the result and click save to save the result
				// the fields contains following info
				//{
				//	"vehicle": "辽H23717",
				//	"guahao": "辽HL736挂",
				//	"qty": "32吨",
				//	"driver": "肖兵",
				//	"cell_number": "18741299456",
				//	"pid": "210321197012165013",
				//	"yayun": "",
				//	"yayun_pid": "",
				//	"yayun_cell_number": ""
				//}
				let dialog = new frappe.ui.Dialog({
					title: __("识别结果"),
					fields: [
						{
							label: __("车号"),
							fieldname: "vehicle",
							fieldtype: "Data",
						},
						{
							label: __("挂号"),
							fieldname: "guahao",
							fieldtype: "Data",
						},
						{
							label: __("预装量"),
							fieldname: "qty",
							fieldtype: "Data",
						},
						{
							label: __("司机"),
							fieldname: "driver",
							fieldtype: "Data",

						},
						{
							label: __("手机号"),
							fieldname: "cell_number",
							fieldtype: "Data",

						},
						{
							label: __("司机身份证"),
							fieldname: "pid",
							fieldtype: "Data",

						},
						{
							label: __("押运员"),
							fieldname: "yayun",
							fieldtype: "Data",

						},
						{
							label: __("押运员身份证"),
							fieldname: "yayun_pid",
							fieldtype: "Data",
						},
						{
							label: __("押运手机号"),
							fieldname: "yayun_cell_number",
							fieldtype: "Data",
						}
					],
					primary_action_label: __("保存"),
					primary_action: function () {
						//console.log('save')
						//create a new scale item and save the result
						frappe.call({
							method: "shipping_management.shipping_management.doctype.scale_item_creator.scale_item_creator.create_scale_item",
							args: {
								vehicle: dialog.get_value("vehicle"),
								guahao: dialog.get_value("guahao"),
								qty: dialog.get_value("qty"),
								driver: dialog.get_value("driver"),
								cell_number: dialog.get_value("cell_number"),
								pid: dialog.get_value("pid"),
								yayun: dialog.get_value("yayun"),
								yayun_pid: dialog.get_value("yayun_pid"),
								yayun_cell_number: dialog.get_value("yayun_cell_number"),
								date: frm.doc.date,
								type: frm.doc.type,
							},
							callback: function (r) {
								if (r.message) {
									frappe.msgprint(__("Scale Item Created: {0}", [r.message]));
								}
							}
						});
						$('.modal-backdrop').hide();
						$('.modal').hide()
					},
				});
				dialog.set_values(r.message);
				dialog.show();
				$('.modal-backdrop').unbind('click');
				dialog.$wrapper.unbind('click');
				dialog.$wrapper.find('.btn-modal-close').on('click', function () {
					$('.modal-backdrop').hide();
					$('.modal').hide()
				})
			}
		});
	}
});
