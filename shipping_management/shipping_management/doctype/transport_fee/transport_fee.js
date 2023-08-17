// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt

frappe.ui.form.on('Transport Fee', {
	refresh: function (frm) {
		disable_button_submitted(frm);
		if (!frm.doc.transaction_date) {
			frm.doc.transaction_date = frappe.datetime.get_today();
			frm.refresh_field('transaction_date');
		}
	},

	fetch_ship_order_items: function (frm) {
		fetch_ship_order_items(frm);
	},

	price: function (frm) {
		frm.doc.total_amount = frm.doc.price * frm.doc.total_qty;
		frm.doc.total = frm.doc.total_amount + frm.doc.loss_amount;
		frm.refresh_field('total_amount');
		frm.refresh_field('total');
	},
	total_qty: function (frm) {
		frm.doc.total_amount = frm.doc.price * frm.doc.total_qty;
		frm.doc.total = frm.doc.total_amount + frm.doc.loss_amount;
		frm.refresh_field('total_amount');
		frm.refresh_field('total');
	},
	loss_weight: function (frm) {
		frm.doc.loss_amount = frm.doc.loss_price * frm.doc.loss_weight;
		frm.doc.total = frm.doc.total_amount + frm.doc.loss_amount;
		frm.refresh_field('loss_amount');
		frm.refresh_field('total');
	},

	items: function (frm) {
		frm.doc.total_amount = frm.doc.price * frm.doc.total_qty;
		frm.refresh_field('total_amount');
	},
	loss_price: function (frm) {
		frm.doc.loss_amount = frm.doc.loss_price * frm.doc.loss_weight;
		frm.doc.total = frm.doc.total_amount + frm.doc.loss_amount;
		frm.refresh_field('loss_amount');
		frm.refresh_field('total');
	},
	loss_amount: function (frm) {
		frm.doc.total = frm.doc.total_amount + frm.doc.loss_amount;
		frm.refresh_field('total');
	},
	total_amount: function (frm) {
		frm.doc.total = frm.doc.total_amount + frm.doc.loss_amount;
		frm.refresh_field('total');
	},



});

function fetch_ship_order_items(frm) {

	if (frm.doc.start_date && frm.doc.end_date && frm.doc.transporter && frm.doc.company) {
		frappe.call({
			method: 'shipping_management.shipping_management.doctype.transport_fee.transport_fee.get_scale_item_to_clear',
			args: {
				start_date: frm.doc.start_date,
				end_date: frm.doc.end_date,
				transporter: frm.doc.transporter,
				company: frm.doc.company
			},
			callback: function (response) {
				if (response.message && response.message.status === 'success') {
					if (response.message.items.length === 0) {
						frappe.msgprint(__('没有找到符合条件的车辆运输历史记录'));
						return;
					}

					let scale_items = response.message.items;

					// Clear the existing items
					frm.doc.items = [];

					for (let scale_item of scale_items) {
						let item = frm.add_child('items');
						item.date = scale_item.date;
						item.vehicle = scale_item.vehicle;
						item.qty = scale_item.qty;
						item.load_net_weight = scale_item.load_net_weight;
						item.offload_net_weight = scale_item.offload_net_weight;
						item.variance = scale_item.variance;
						item.scale_item = scale_item.scale_item;
					}

					frm.doc.total_qty = response.message.total_qty;
					frm.doc.loss_weight = response.message.loss_weight;
					// Refresh the form to display the updated items
					frm.refresh_field('loss_weight');
					frm.refresh_field('items');
					frm.refresh_field('total_qty');
					if (frm.doc.price && frm.doc.total_qty) {
						frm.doc.total_amount = frm.doc.price * frm.doc.total_qty;
						frm.refresh_field('total_amount');
					}

					if (frm.doc.loss_price && frm.doc.loss_weight) {
						frm.doc.loss_amount = frm.doc.loss_price * frm.doc.loss_weight;
						frm.refresh_field('loss_amount');
					}

					frm.doc.total = frm.doc.total_amount + frm.doc.loss_amount;

					frm.refresh_field('total');

				} else {
					frappe.msgprint(__('Error fetching ship order items: ') + response.message.message);
				}
			}
		});
	}
	else {
		frappe.throw(__('请输入必要的信息以获取车辆运输历史记录'));
	}
}

frappe.ui.form.on("Transport Fee Detail", {
	refresh: function (frm) {
		// Trigger when a row is added or removed
		frm.fields_dict["items"].grid.wrapper.on("grid-row-render", function () {
			calculate_totals(frm);
		});

	},
});

frappe.ui.form.on("Transport Fee Detail", {
	items_add: function (frm) {
		calculate_totals(frm);
	},
	items_remove: function (frm) {
		calculate_totals(frm);
	},
	// Trigger when 'qty' field in the child table is updated
	qty: function (frm, cdt, cdn) {
		calculate_totals(frm);
	},
});

function calculate_totals(frm) {
	let total_qty = 0;
	let loss_weight = 0;
	for (let row of frm.doc.items) {
		total_qty += row.qty;
		if (row.variance < 0) {
			loss_weight += row.variance
		}

	}

	frm.set_value("total_qty", total_qty);
	frm.set_value("loss_weight", loss_weight)
	frm.refresh_field("total_qty");
	frm.refresh_field("loss_weight");

}


function disable_button_submitted(frm) {
	// Replace 'your_button_name' with the actual button name you want to disable
	var your_button_name = "fetch_ship_order_items";

	// Check if the document is submitted
	if (frm.doc.docstatus === 1) {
		// Disable the button
		frm.get_field(your_button_name).$input.prop('disabled', true);
	} else {
		// Enable the button
		frm.get_field(your_button_name).$input.prop('disabled', false);
	}
}


frappe.ui.form.on('Transport Fee', {
	refresh(frm) {
		cur_frm.fields_dict['transporter'].get_query = function (doc) {
			return {
				filters: {
					"is_transporter": 1
				}
			};
		};
	}
});


frappe.ui.form.on('Transport Fee', {
	refresh(frm) {
		if (frm.doc.docstatus == 1) {
			frm.add_custom_button(__('Create Purchase Order'), function () {

				let d = new frappe.ui.Dialog({
					title: '请输入税率模板',
					fields: [
						{
							label: '税率模板',
							fieldname: 'purchase_tax_template',
							fieldtype: 'Link',
							options: 'Purchase Taxes and Charges Template'
						}
					],
					size: 'small', // small, large, extra-large 
					primary_action_label: '提交',
					primary_action(values) {
						frappe.db.get_doc('Purchase Taxes and Charges Template', values.purchase_tax_template)
							.then(tax_doc => {
								if (!tax_doc) {
									frappe.throw(__('税率模板不存在！'));
								}
								else {


									let route_options = {
										transport_fee: frm.doc.name,
										supplier: frm.doc.transporter,
										taxes_and_charges: tax_doc.name,
									};
									frappe.new_doc("Purchase Order", route_options, doc => {
										doc.transaction_date = frappe.datetime.get_today();
										doc.purchase_type = 'P02';
										frappe.db.get_doc('Transport Fee', doc.transport_fee)
											.then(tf_doc => {
												;
												doc.items[0].item_code = '运费';
												doc.items[0].qty = tf_doc.total_qty;
												doc.items[0].rate = tf_doc.total / tf_doc.total_qty;
												doc.items[0].schedule_date = frappe.datetime.get_today();
												doc.items[0].uom = 'Tonne'
											});
										//get default purchase tax template
									});
								}
							});
					}
				});
				d.show();
			});
		}
	}
});




