// Copyright (c) 2024, Alvin and contributors
// For license information, please see license.txt

frappe.ui.form.on('Scale Item Creator', {
	onload_post_render: function (frm) {
		$('.container').css("max-width", "100%");
        $('.container.page-body').css("max-width", "100%");
        frm.get_field("recognize").$input.css("background", "#3E70B4");
        frm.get_field("recognize").$input.css("color", "white");
        frm.get_field("recognize").$input.css("width","50%");
        frm.get_field("recognize").$input.css("line-height","5");
        frm.get_field("recognize").$input.css("font-size","large");

		frm.get_field("refresh_list").$input.css("background", "#E7A014");
        frm.get_field("refresh_list").$input.css("color", "white");
        frm.get_field("refresh_list").$input.css("width","50%");
        frm.get_field("refresh_list").$input.css("line-height","5");
        frm.get_field("refresh_list").$input.css("font-size","large");

		$(".input-with-feedback").css("font-size","large");
        $(".control-value").css("font-size","large");
        $(".control-label").css("font-size","large");
	},
	onload: function (frm) {
		//disable the save button
		frm.disable_save();
	},
	//refresh: function(frm) {
		//
	//},
	refresh_list: function (frm) {
		//refresh the list
		frappe.db.get_list('Scale Item', {
			fields: ['name',
				'vehicle', 
				'guahao', 
				'target_weight', 
				'driver', 
				'cell_number', 
				'driver_id', 
				'yayun', 
				'yayun_pid', 
				'yayun_cell_phone', 
				'transport_license_number', 
				//'zizhong', 
				'zhoushu'],
			filters: { date: frm.doc.date, 
				type: frm.doc.type, 
				item: frm.doc.item, 
				order_note: frm.doc.order_note, 
				supplier: frm.doc.supplier },
			order_by: 'creation asc',
			limit: 'all'
		}).then(records => {
				//console.log(records);
				frm.clear_table('items');
				records.forEach(record => {
					let row = frm.add_child("items", {
						scale_item: record.name,
						vehicle: record.vehicle,
						guahao: record.guahao,
						qty: record.target_weight,
						driver: record.driver,
						phone: record.cell_number,
						driver_id: record.driver_id,
						yayun: record.yayun,
						yayun_pid: record.yayun_pid,
						yayun_cell_phone: record.yayun_cell_phone,
						transport_license_number: record.transport_license_number,
						//zizhong: record.zizhong,
						zhoushu: record.zhoushu,
					});
					
				});
				for (let i = 0; i < records.length; i++) {
					frm.doc.items.move(0, records.length - i - 1);
				}
				frm.refresh_field("items");
			});
	},
	recognize: function (frm) {
		frappe.call({
			method: "shipping_management.shipping_management.doctype.scale_item_creator.scale_item_creator.recoginize_vehicle_alias",
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
							fieldtype: "Column Break",
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
							fieldname: "driver_id",
							fieldtype: "Data",

						},
						//add a column break
						{
							fieldtype: "Column Break",
						},
						{
							label: __("押运员"),
							fieldname: "yayun",
							fieldtype: "Data",

						},
						{
							label: __("押运手机号"),
							fieldname: "yayun_cell_number",
							fieldtype: "Data",
						},
						{
							label: __("押运员身份证"),
							fieldname: "yayun_pid",
							fieldtype: "Data",
						},
						//section break
						{
							fieldtype: "Section Break",
						},
						{
							label: __("道路运输许可证"),
							fieldname: "transport_license_number",
							fieldtype: "Data",
						},
						{
							label: __("自重"),
							fieldname: "zizhong",
							fieldtype: "Data",
						},
						{
							label: __("轴数"),
							fieldname: "zhoushu",
							fieldtype: "Data",
						},
						{
							fieldtype: "Column Break"
						},
						{
							label: __("识别文本"),
							fieldname: "text",
							fieldtype: "Small Text",
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
								target_weight: dialog.get_value("qty"),
								driver: dialog.get_value("driver"),
								cell_number: dialog.get_value("cell_number"),
								driver_id: dialog.get_value("driver_id"),
								yayun: dialog.get_value("yayun"),
								yayun_pid: dialog.get_value("yayun_pid"),
								yayun_cell_phone: dialog.get_value("yayun_cell_number"),
								transport_license_number: dialog.get_value("transport_license_number"),
								zizhong: dialog.get_value("zizhong"),
								zhoushu: dialog.get_value("zhoushu"),
								baohao_text: frm.doc.vehicle_text,
								date: frm.doc.date,
								type: frm.doc.type,
								item: frm.doc.item,
								order_note: frm.doc.order_note,
							},
							callback: function (r) {
								if (r.message) {
									//add the new scale item to the child table
									let row = frm.add_child("items", {
										scale_item: r.message.name,
										vehicle: r.message.vehicle,
										guahao: r.message.guahao,
										qty: r.message.target_weight,
										driver: r.message.driver,
										phone: r.message.cell_number,
										driver_id: r.message.driver_id,
										yayun: r.message.yayun,
										yayun_pid: r.message.yayun_pid,
										yayun_cell_phone: r.message.yayun_cell_phone,
										transport_license_number: r.message.transport_license_number,
										zizhong: r.message.zizhong,
										zhoushu: r.message.zhoushu,
									});
									frm.doc.items.move(frm.doc.items.length - 1, 0);
									frm.refresh_field("items");
									dialog.hide();
								}
							}
						});
					},
				});
				dialog.set_values(r.message);
				dialog.show();
				//$('.modal-backdrop').unbind('click');
				//dialog.$wrapper.unbind('click');
				//dialog.$wrapper.find('.btn-modal-close').on('click', function () {
				//	$('.modal-backdrop').hide();
				//	$('.modal').hide()
				//})
			}
		});
	}
});
