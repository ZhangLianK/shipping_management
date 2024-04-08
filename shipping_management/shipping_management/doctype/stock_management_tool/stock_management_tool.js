// Copyright (c) 2024, Alvin and contributors
// For license information, please see license.txt
frappe.ui.form.on("Stock Child", {
	onload_post_render: function (frm) {
		$('.container').css("max-width", "100%")
	},
	form_render: function (frm, cdt, cdn) {
		$('.grid-delete-row').remove();
		$('.grid-insert-row').remove();
		$('.grid-insert-row-below').remove();
		$('.grid-duplicate-row').remove();
		$('.grid-move-row').remove();
		$('.grid-append-row').remove();
		var row = locals[cdt][cdn];
		var row_name = row.scale_item;
		// Target the row-actions element of the current row and remove existing custom action buttons
		$(`div[data-idx='${row.idx}']`).find('.row-actions .custom-action-btn').remove();

		if ((!row.delivery_note && (row.type == "OUT" || row.type == "DIRC") && row.status.slice(0,1) >= '3' && row.bill_type == "ZT")
		||(!row.delivery_note && (row.type == "OUT" || row.type == "DIRC") && row.status.slice(0,1) == '5' && row.bill_type == "SD")){
			//add a refresh button to refresh the scale child
			console.log("row_name", row_name);

			// Append the new custom action button to the row-actions span
			// Ensure the button is given a class for easy identification (e.g., 'custom-action-btn')
			var button_html = `<button id="custom-action-${row_name}-dn" class="btn btn-primary btn-sm pull-right hidden-xs custom-action-btn">创建销售出库单</button>`;
			$(`div[data-idx='${row.idx}']`).find('.row-actions').append(button_html);

			// Bind the click event to the new button
			$(`#custom-action-${row_name}-dn`).on('click', function () {
				
				// Implement your custom action here
				console.log('create delivery note for', row_name);
				// Example: Log the entire row object to console
				console.log(row);
				//send the row doc to the backend to save
				if (row.delivery_note) {
					frappe.throw(__('已经创建出库单，请勿多次创建！请检查已经创建的关联入库单！'));
					return;
				}
				if (!row.pot){
					frappe.throw(__('该物流计量单无【罐（库位）】信息！'));
					return;
				}

				frappe.realtime.on("create_delivery_note_progress", function(data) {
					if(data.progress) {
						frappe.hide_msgprint(true);
						frappe.show_progress(__("创建发货单"), data.progress[0],data.progress[1]);
					}
				});
					frappe.call({
						method: "shipping_management.shipping_management.doctype.stock_management_tool.stock_management_tool.make_delivery_note",
						args: {
							"source_name": row_name,
						},
						callback: function (r) {
							if (r.message.status == "success") {
								frappe.msgprint("出库单创建成功！" + r.message.doc_name);
								// You now have the scale item data returned from the server
								let delivery_note = r.message.doc_name
								//clear the child table
								frm.clear_table('stock_childs');
								refresh_scale_item(frm);
							}
							else {
								frappe.msgprint("出库单创建失败！" + r.message.message);
							}
						}
					})
				
			});
		}

		if ((!row.purchase_receipt && row.type == "IN" && row.status.slice(0,1) >= '5') ||
			(!row.purchase_receipt && row.type == "DIRC" && row.status.slice(0,1) >= '3' && row.bill_type == "ZT") ||
			(!row.purchase_receipt && row.type == "DIRC" && row.status.slice(0,1) >= '3' && row.bill_type == "SD")){
			// Append the new custom action button to the row-actions span
			// Ensure the button is given a class for easy identification (e.g., 'custom-action-btn')
			var button_html = `<button id="custom-action-${row_name}-pr" class="btn btn-primary btn-sm pull-right hidden-xs custom-action-btn">创建采购入库单</button>`;
			$(`div[data-idx='${row.idx}']`).find('.row-actions').append(button_html);

			// Bind the click event to the new button
			$(`#custom-action-${row_name}-pr`).on('click', function () {
				
				// Implement your custom action here
				console.log('create purchase receipt for', row_name);
				// Example: Log the entire row object to console
				console.log(row);
				//send the row doc to the backend to save
				if (row.purchase_receipt) {
					frappe.throw(__('已经创建入库单，请勿多次创建！请检查已经创建的关联入库单！'));
					return;
				}
				if (!row.pot){
					frappe.throw(__('该物流计量单无【罐（库位）】信息！'));
					return;
				}
					frappe.call({
						method: "shipping_management.shipping_management.doctype.stock_management_tool.stock_management_tool.make_purchase_receipt",
						args: {
							"source_name": row_name,
						},
						callback: function (r) {
							if (r.message.status == "success") {
								frappe.msgprint("入库单创建成功！" + r.message.doc_name);
								// You now have the scale item data returned from the server
								let purchase_receipt = r.message.doc_name
								//clear the child table
								frm.clear_table('stock_childs');
								refresh_scale_item(frm);
							}
							else {
								frappe.msgprint("入库单创建失败！" + r.message.message);
							}
						}
					})
				
			});
		}
	},
});




frappe.ui.form.on('Stock Management Tool', {
	refresh: function(frm) {

		//add a refresh button to refresh the scale child
		frm.add_custom_button(__('获取未完成物流单'), function () {
			refresh_scale_item(frm);
		});
		frm.add_custom_button(__('批量完成'), function () {
			//get the selected rows in child table stock_childs
			let selected_rows = frm.doc.stock_childs.filter(row => row.__checked == 1);
			//loop the selected rows and set status to '6 已完成' using  frappe.db.set_value
			for (let row of selected_rows) {
				frappe.db.set_value('Scale Item', row.scale_item, 'status', '6 已完成').then(r => {
					if (r.message.status == "6 已完成") {
						//refresh the stock_childs table
						frappe.msgprint("物流单" + row.scale_item + "已完成！");
					}
				});
			}
		});
	},
	type: function (frm) {
		//refresh the stock_childs table
		refresh_scale_item(frm);
	},
	sales_order: function (frm) {
		//refresh the stock_childs table
		refresh_scale_item(frm);
	},
	ship_plan: function (frm) {
		//refresh the stock_childs table
		refresh_scale_item(frm);
	},
	company: function (frm) {
		//refresh the stock_childs table
		refresh_scale_item(frm);
	},
	onload: function (frm) {
		// Hide the save button
		frm.disable_save();
		frm.set_query("type", function () {
			return {
				filters: [
					["Ship Type", "name", "in", ["IN", "OUT","DIRC"]
					]]
				}
		});
		
		frm.set_query("sales_order", function () {
			return {
				filters: {
					'status': ['not in', ["Closed", "Completed",'Cancelled']]
				}
			};
		}
		);

		frm.set_query("ship_plan", function () {
			return {
				filters: {
					'status': ['not in', ["完成"]]
				}
			};
		}
		);
	}
});


function refresh_scale_item(frm, exp) {
	frappe.call({
		method: "shipping_management.shipping_management.doctype.stock_management_tool.stock_management_tool.get_scale_childs", // Replace with your app and module names
		args: {
			"ship_plan": frm.doc.ship_plan, // Pass the ship_plan from the current form
			"type": frm.doc.type,
			"sales_order": frm.doc.sales_order,
			"company": frm.doc.company
		},
		callback: function (r) {
			if (r.message) {
				if (r.message.includes('http')) {
					window.location.href = r.message;
				}
				else {
					// You now have the scale item data returned from the server
					let scale_item_data = r.message;
					//clear the child table
					frm.clear_table('stock_childs');
					//add scale item to the child table
					for (let row of scale_item_data) {
						frm.add_child('stock_childs', {
							scale_item: row.name,
							target_weight: row.target_weight,
							vehicle: row.vehicle,
							status: row.status,
							type: row.type,
							sales_order: row.sales_order,
							purchase_order: row.purchase_order,
							pot: row.pot,
							bill_type: row.bill_type,
							purchase_receipt: row.purchase_receipt,
							delivery_note: row.delivery_note,
							load_net_weight: row.load_net_weight,
							offload_net_weight: row.offload_net_weight,
						});
					}
					//wait until all grid row is added and DOM is rendered
					frm.refresh_field('stock_childs');
				}
			}
			//check if r.message contains http

		}
	});
}