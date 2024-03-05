// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt


frappe.ui.form.on("Scale Child", {
	form_render: function (frm, cdt, cdn) {

		$('.grid-delete-row').remove();
		var row = locals[cdt][cdn];

		//make vehicle readnly if it has values
		if (row.vehicle) {
			//set read only
			var grid_row = frm.fields_dict["scale_child"].grid.grid_rows_by_docname[cdn];

			// Make the vehicle field read-only if it has a value
			if (grid_row && grid_row.doc.vehicle) {
				grid_row.toggle_editable("vehicle", false); // Pass fieldname and false to make it read-only
			}
		}

		var row_name = row.scale_item;
		if (row_name != 'N') {

			// Target the row-actions element of the current row and remove existing custom action buttons
			$(`div[data-idx='${row.idx}']`).find('.row-actions .custom-action-btn').remove();

			// Append the new custom action button to the row-actions span
			// Ensure the button is given a class for easy identification (e.g., 'custom-action-btn')
			var button_html = `<button id="custom-action-${row_name}" class="btn btn-primary btn-sm pull-right hidden-xs custom-action-btn">保存</button>`;
			$(`div[data-idx='${row.idx}']`).find('.row-actions').append(button_html);

			// Bind the click event to the new button
			$(`#custom-action-${row_name}`).on('click', function () {
				// Implement your custom action here
				console.log('Custom action button clicked for row', row_name);
				// Example: Log the entire row object to console
				console.log(row);
				//send the row doc to the backend to save
				frappe.call({
					method: "shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.save_scale_item", // Replace with your app and module names
					args: {
						"doc_data": row // Pass the scale_child from the current form
					},
					callback: function (r) {
						if (r.message == 'success') {
							// You now have the saved scale child data returned from the server
							let scale_child_doc = r.message;
							frappe.msgprint("保存成功");
							refresh_scale_item(frm);
						}
						else {
							frappe.msgprint("保存失败 请联系管理员." + r.message);
						}
					}
				});

			});
		}
	},
	scale_child_add: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		row.purchase_order = frm.doc.purchase_order
		row.sales_invoice = frm.doc.sales_invoice
		row.sales_order = frm.doc.sales_order
		row.transporter = frm.doc.transporter
		row.type = frm.doc.type
		row.market_segment = frm.doc.market_segment
		row.from_addr = frm.doc.from_addr
		row.to_addr = frm.doc.to_addr
		//if doc.order_note contains '送到' then set the bill_type to 'SD'
		row.bill_type = frm.doc.bill_type
		row.scale_item = 'N'
		frm.refresh_field('scale_child');
		//updateVehicleFieldReadonlyStatus(frm)
	},
	before_scale_child_remove: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		if (row.scale_item && row.scale_item != 'N') {
			frappe.call({
				method: "shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.cancel_scale_child", // Replace with your app and module names
				args: {
					"scale_item": row.scale_item // Pass the scale_item from the current form
				},
				callback: function (r) {
					if (r.message.status == 'success') {
						// You now have the scale item data returned from the server
						frm.set_value('assigned_qty', r.message.ship_plan.assigned_qty);
						frappe.msgprint("取消成功");
					}
				}
			});
		}
		calculate_totals(frm);
	},
	scale_child_remove: function (frm, cdt, cdn) {
		calculate_totals(frm);
	},
	target_weight: function (frm, cdt, cdn) {
		calculate_totals(frm);
	},
	pot: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		//get the parent warehouse of pot from the warehouse doctype 
		if (row.type == 'IN' || row.type == 'OUT') {
			frappe.db.get_value('Warehouse', row.pot, 'parent_warehouse').then(r => {
				if (r) {
					if (row.type == 'IN') {
						row.to_addr = r.message.parent_warehouse.split('-')[0];
					}
					else if (row.type == 'OUT') {
						row.from_addr = r.message.parent_warehouse.split('-')[0];
					}
					frm.refresh_field('scale_child');
				}
			});
		}
	},
	type: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		if (row.type == 'IN' || row.type == 'OUT') {
			frappe.db.get_value('Warehouse', row.pot, 'parent_warehouse').then(r => {
				if (r) {
					if (row.type == 'IN') {
						row.to_addr = r.message.parent_warehouse.split('-')[0];
					}
					else if (row.type == 'OUT') {
						row.from_addr = r.message.parent_warehouse.split('-')[0];
					}
					frm.refresh_field('scale_child');
				}
			});
		}
		//get the parent warehouse of pot from the warehouse doctype 
		else if (row.type == 'DIRC') {
			//get the default in-transit warehouse for the company
			frappe.db.get_value('Company', frm.doc.company, 'default_in_transit_warehouse').then(r => {
				if (r) {
					//set the pot 
					row.pot = r.message.default_in_transit_warehouse;
					frm.refresh_field('scale_child');
				}
			});
		}
	}
});

frappe.ui.form.on('Shipping Management Tool', {
	onload: function (frm) {
		// Hide the save button
		frm.disable_save();
		frm.set_query("transporter", function () {
			return {
				filters: {
					"is_transporter": 1
				}
			};
		}
		);
		frm.set_query("sales_order", function () {
			return {
				filters: {
					'status': ['not in', ["Closed", "Completed"]]
				}
			};
		}
		);
		frm.set_query("sales_invoice", function () {
			return {
				filters: [
					['Sales Invoice Item', 'sales_order', '=', frm.doc.sales_order]
				]
			};
		});
		frm.set_query("ship_plan", function () {
			return {
				filters: {
					'status': ['not in', ["完成"]]
				}
			};
		});
	},
	order_note: function (frm) {
		if (frm.doc.order_note && (frm.doc.order_note.includes('送到') || frm.doc.order_note.includes('送'))) {
			frm.doc.bill_type = 'SD'
			frm.refresh_field('bill_type');
		}
		else if (frm.doc.order_note && (frm.doc.order_note.includes('自提'))) {
			frm.doc.bill_type = 'ZT'
			frm.refresh_field('bill_type');
		}
		else {
			frm.doc.bill_type = ''
			frm.refresh_field('bill_type');
		}
	},
	export_xlsx: function (frm) {
		if (!frm.doc.ship_plan) {
			frappe.throw(__('请先选择物流计划'));
			return;
		}
		let exp = true;
		refresh_scale_item(frm, exp);
	},
	ship_plan: function (frm) {
		if (frm.doc.ship_plan) {
			refresh_scale_item(frm);
		}
		else {
			frm.clear_table('scale_child');
			frm.refresh_field('scale_child');
		}
	},
	transporter: function (frm) {
		refresh_scale_item(frm);
	},
	type: function (frm) {
		refresh_scale_item(frm);
	},
	sales_order: function (frm) {
		refresh_scale_item(frm);
	},
	sales_invoice: function (frm) {
		refresh_scale_item(frm);
	},
	bill_type: function (frm) {
		refresh_scale_item(frm);
	},
	onload_post_render: function (frm) {
		$('.container').css("max-width", "100%")
	},
	query_qty: function (frm) {
		frm.set_value('variance_qty', frm.doc.current_qty - frm.doc.query_qty);
	},
	current_qty: function (frm) {
		frm.set_value('variance_qty', frm.doc.current_qty - frm.doc.query_qty);
	},

	refresh: function (frm) {

		frm.fields_dict['scale_child'].grid.get_field('transporter').get_query = function (doc, cdt, cdn) {
			// Here, you return an object with the filters you want to apply.
			return {
				filters: {
					"is_transporter": 1
				}
			};
		};

		frm.fields_dict['scale_child'].grid.get_field('sales_invoice').get_query = function (doc, cdt, cdn) {
			let row = locals[cdt][cdn];
			// Here, you return an object with the filters you want to apply.
			return {
				filters: [
					['Sales Invoice Item', 'sales_order', '=', row.sales_order]
				]
			};
		};
		//updaten field from_addr or to_addr after the pot is set
		frm.fields_dict['scale_child'].grid.get_field('pot')


		// Hide the save button
		frm.disable_save();
		//remove the menu 
		frm.page.clear_menu();
		//remove all fields value in this form except the company
		frm.clear_table
		//add a refresh button to refresh the scale child
		frm.add_custom_button(__('刷新物流单'), function () {
			if (!frm.doc.ship_plan && !frm.doc.sales_invoice && !frm.doc.sales_order) {
				frappe.throw(__('请先选择【物流计划】，或者【销售费用清单】，或者【销售订单】'));
				return;
			}
			refresh_scale_item(frm);
		});

		
		// Empty the sidebar to avoid duplicating items on refresh
		frm.page.sidebar.empty();
		// Create a search box and prepend it to the sidebar
		var $search_box = $('<input type="text" placeholder="Search Vehicles..." class="form-control sidebar-search-box">')
			.prependTo(frm.page.sidebar)
			.on('input', function () {
				var search_value = $(this).val().toLowerCase();
				// Filter the vehicle list based on the search
				$('.custom-sidebar-multiselect .vehicle-id').each(function () {
					var $label = $(this);
					var text = $label.text().toLowerCase();
					if (text.includes(search_value)) {
						$label.parent().show();
					} else {
						$label.parent().hide();
					}
				});
			});
		$search_box.css({
			//change background color of search box
			'background-color': 'white',
			'border': 'none',
			'border-radius': '5px',

		});
		// Create a "Clear Selection" button and append it below the search box
		var $clear_button = $('<button class="btn btn-default btn-xs sidebar-clear-button">')
			.text('Clear Selection')
			.appendTo(frm.page.sidebar)
			.on('click', function () {
				// Clear all selected checkboxes
				$('.custom-sidebar-multiselect input[type="checkbox"]').prop('checked', false);
				// Perform additional actions if required, e.g., refreshing another part of the page
			});
		$clear_button.css({
			'margin-top': '15px', // Add margin-top to separate from search box

		});

		// Create a container for the multi-select list and append it below the search box
		var $multi_select_container = $('<div class="custom-sidebar-multiselect"></div>').appendTo(frm.page.sidebar);

		// Style the container for the vehicle checkboxes
		$multi_select_container.css({
			'background-color': 'white',
			'padding': '10px',
			'border-radius': '5px',
			'margin-top': '15px', // Add margin-top to separate from search box
			'overflow-y': 'auto',
			'max-height': '300px', // Set a max height with scroll
		});
		//get  default_transporter from session default
		let transporter = frappe.user_defaults.default_transporter;
		frappe.call({
			method: "shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.get_vehicles", // Replace with your app and module names
			args: {
				"transporter": transporter // Pass the transporter from the current form
			}
		}).then(r => {
			if (r.message) {
				// Add checkboxes and information to the container for each vehicle
				$.each(r.message, function (i, vehicle) {
					var $checkbox_wrapper = $('<div class="vehicle-row">').appendTo($multi_select_container);

					// Create a checkbox for each vehicle
					var $checkbox = $('<input type="checkbox" class="vehicle-checkbox">')
						.data('vehicle-id', vehicle.id) // Store the vehicle ID
						.data('vehicle-name', vehicle.name) // Store the vehicle name
						.data('vehicle-in-process', vehicle.processing) // Store the vehicle in_process
						.appendTo($checkbox_wrapper);

					// Display vehicle ID
					var $id_span = $('<span class="vehicle-id">').text(vehicle.id).appendTo($checkbox_wrapper);

					// Display vehicle name (you can concatenate it with ID or keep it separate)
					var $name_span = $('<span class="vehicle-name">').text(vehicle.name).appendTo($checkbox_wrapper);

					// Display vehicle in_process
					var $in_process_span = $('<span class="vehicle-in-process">').text(vehicle.processing).appendTo($checkbox_wrapper);

					// Handle checkbox click event
					$checkbox.on('click', function () {
						// Get all selected vehicles
						var selected_vehicles = [];
						$multi_select_container.find('.vehicle-checkbox:checked').each(function () {
							var vehicleId = $(this).data('vehicle-id');
							var vehicleName = $(this).data('vehicle-name');
							var vehicleInProcess = $(this).data('vehicle-in-process');
							selected_vehicles.push({
								id: vehicleId,
								name: vehicleName,
								in_process: vehicleInProcess
							});
						});
						// Do something with the selected vehicles
						console.log('Selected vehicles:', selected_vehicles);
					});
				});
			}
		}
		);
		
		const css = `
		.vehicle-row {
			display: flex;
			align-items: center;
			margin-bottom: 10px;
		}
		
		.vehicle-checkbox {
			margin-right: 10px; /* Add space between checkbox and text */
		}
		
		.vehicle-id, .vehicle-name {
			margin-right: 10px; /* Add space between ID and Name if needed */
		}
        `;

		$('<style>')
			.html(css)
			.appendTo('head');

		//add a button to the doctype, when click it get the checked vehicles and create new scale child into the child table
		frm.add_custom_button(__('分配车辆'), function () {
			if (!frm.doc.ship_plan && !frm.doc.sales_invoice && !frm.doc.sales_order) {
				frappe.throw(__('请选择【物流计划】，或者【销售费用清单】，或者【销售订单】'));
				return;
			}
			// Get all selected vehicles
			var selected_vehicles = [];
			$('.vehicle-checkbox:checked').each(function () {
				var vehicleId = $(this).data('vehicle-id');
				var vehicleName = $(this).data('vehicle-name');
				selected_vehicles.push({
					id: vehicleId,
					name: vehicleName
				});
			});
			// Do something with the selected vehicles
			console.log('Selected vehicles:', selected_vehicles);

			// Create a new scale child for each selected vehicle
			$.each(selected_vehicles, function (i, vehicle) {
				// This could be part of a custom script for the parent doctype that includes 'Scale Child' as a table.

				frappe.call({
					method: "shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.get_scale_child", // Replace with your app and module names
					args: {
						"vehicle": vehicle.name, // Pass the vehicle ID or name from the current form
						//"from_addr": cur_frm.doc.from_addr, // Pass the from address from the current form
						//"to_addr": cur_frm.doc.to_addr // Pass the to address from the current form
					},
					callback: function (r) {
						if (r.message) {
							// You now have the scale child data returned from the server
							let scale_child_data = r.message;
							var row = frm.add_child('scale_child', {
								scale_item: scale_child_data.scale_item,
								vehicle: scale_child_data.vehicle,
								target_weight: scale_child_data.target_weight,
								from_addr: frm.doc.from_addr,
								to_addr: frm.doc.to_addr,
								driver: scale_child_data.driver,
								cell_number: scale_child_data.cell_number,
								sales_order: frm.doc.sales_order,
								sales_invoice: frm.doc.sales_invoice,
								purchase_order: frm.doc.purchase_order,
								transporter: frm.doc.transporter,
								type: `${frm.doc.type ? frm.doc.type : "OTH"}`,
								bill_type: frm.doc.bill_type
								
							});
							row.id = vehicle.id
							
							calculate_totals(frm);
							frm.refresh();
						}
					}
				});
			});

			// Refresh the form to display the new rows

		});

		frm.add_custom_button(__('批量分配销售订单'), function () {
			//create a dialog to let user to input sales order and sales invoice
			let d = new frappe.ui.Dialog({
				'title': '批量分配销售订单',
				'fields': [
					{
						'label': '销售订单',
						'fieldname': 'sales_order',
						'fieldtype': 'Link',
						'options': 'Sales Order',
						'reqd': 0,
						'get_query': function () {
							return {
								filters: {
									'status': ['not in', ["Closed", "Completed"]]
								}
							}
						}
					},
					{
						'label': '送货地',
						'fieldname': 'to_addr',
						'fieldtype': 'Data',
						'reqd': 1,
						'get_query': function () {
							return {
								filters: [
									['Sales Invoice Item', 'sales_order', '=', d.fields_dict.sales_order.get_value()]
								]
							}
						}
					}
				],
				primary_action: function () {
					//get the sales order's order note
					
					frappe.db.get_value('Sales Order', d.fields_dict.sales_order.get_value(), 'order_note').then(r => {
						let bill_type = '';
						if (r) {
							if (r.message.order_note.includes('送到') || r.message.order_note.includes('送')) {
								bill_type = 'SD';
							}
							else if (r.message.order_note.includes('自提')) {
								bill_type = 'ZT';
							}
							else {
								bill_type = '';
							}
						}
						//get all scale child related that checked in the frm.doc.scale_child table
					let scale_childs = frm.doc.scale_child;
					//find all scale child that was checked by user
					let checked_scale_childs = scale_childs.filter(function (row) {
						return row.__checked == 1;
					}
					);
					if (checked_scale_childs.length == 0) {
						frappe.msgprint("请先选择要分配的行");
						return;
					}
					// set the sales order and sales invoice to the checked scale child
					for (let row of checked_scale_childs) {
						row.sales_order = d.fields_dict.sales_order.get_value();
						row.to_addr = d.fields_dict.to_addr.get_value();
						row.bill_type = bill_type;
						if (row.type == 'OTH'){
							row.type = 'DIRC';
						}
					}
					d.hide();
					frm.refresh_field('scale_child');
					});
					
				}
			});
			d.show();

		}
		);
		frm.add_custom_button(__('保存'), function () {

			//call backend function to save the doc
			frappe.call({
				method: "shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.save_doc", // Replace with your app and module names
				args: {
					"doc_data": frm.doc // Pass the current form data
				},
				callback: function (r) {
					if (r.message) {
						//  check if any error returned from the server
						if (r.message.error) {
							frappe.throw(r.message.error);
							return;
						}
						else {
							// You now have the saved doc returned from the server
							if (r.message == 'success') {
								frappe.msgprint("保存成功");
							}
							else {
								let ship_plan_doc = r.message;
								frm.set_value('assigned_qty', ship_plan_doc.assigned_qty);
								frappe.msgprint("保存成功");
							}
							frm.doc.__unsaved = false;
							refresh_scale_item(frm);
						}
					}
				}
			});
		});
		$("[data-label='%E4%BF%9D%E5%AD%98']").css({"background-color": "#007bff", "color": "white"});


	},
});

function calculate_totals(frm) {
	//calculate the total qty from scale child table
	let total_qty = 0;
	for (let row of frm.doc.scale_child) {
		total_qty += row.target_weight;
	}

	frm.doc.current_qty = total_qty;
	frm.refresh_field('current_qty');
	frm.doc.variance_qty = frm.doc.current_qty - frm.doc.query_qty;
	frm.refresh_field('variance_qty');
}


function refresh_scale_item(frm, exp) {
	//get all scale item related to this ship_plan
	if (!frm.doc.ship_plan && !frm.doc.sales_invoice && !frm.doc.sales_order) {
		frappe.msgprint("请选择【物流计划】,或者【销售费用清单】，或者【销售订单】");
		return;
	}
	frappe.call({
		method: "shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.get_scale_childs", // Replace with your app and module names
		args: {
			"ship_plan": frm.doc.ship_plan, // Pass the ship_plan from the current form
			"type": frm.doc.type,
			"transporter": frm.doc.transporter,
			"sales_order": frm.doc.sales_order,
			"sales_invoice": frm.doc.sales_invoice,
			"export": exp,
			"bill_type": frm.doc.bill_type
		},
		callback: function (r) {
			if (r.message) {
				if (r.message.includes('http')) {
					window.location.href = r.message;
				}
				else {
					// You now have the scale item data returned from the server
					let scale_item_data = r.message;
					let total_qty = 0;
					//clear all scale_child table
					frm.clear_table('scale_child');
					//add scale item to the child table
					for (let row of scale_item_data) {
						frm.add_child('scale_child', {
							scale_item: row.name,
							target_weight: row.target_weight,
							vehicle: row.vehicle,
							from_addr: row.from_addr,
							to_addr: row.to_addr,
							driver: row.driver,
							status: row.status,
							id: row.id,
							cell_number: row.cell_number,
							type: row.type,
							sales_order: row.sales_order,
							sales_invoice: row.sales_invoice,
							purchase_order: row.purchase_order,
							transporter: row.transporter,
							pot: row.pot,
							bill_type: row.bill_type
						});
						total_qty += row.target_weight
					}
					//wait until all grid row is added and DOM is rendered
					frm.refresh_field('scale_child');
					//update total qty of the scale child, and set tht value to query_qty field
					frm.doc.query_qty = total_qty;
					frm.doc.current_qty = total_qty;
					frm.refresh_field('query_qty');
					frm.refresh_field('current_qty');
					frm.doc.variance_qty = frm.doc.current_qty - frm.doc.query_qty;
					frm.refresh_field('variance_qty');
				}
			}
			//check if r.message contains http

		}
	});
}

function updateVehicleFieldReadonlyStatus(frm) {

	frm.fields_dict['scale_child'].grid.grid_rows.forEach((grid_row) => { // Replace 'child_table_fieldname' with the fieldname of your child table
		if (grid_row.doc.vehicle) { // If vehicle has a value, make it read-only
			grid_row.toggle_editable('vehicle', false); // Make vehicle field read-only
		} else {
			grid_row.toggle_editable('vehicle', true); // Make vehicle field editable
		}
	});
}
