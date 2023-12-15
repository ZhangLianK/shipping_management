// Copyright (c) 2023, Alvin and contributors
// For license information, please see license.txt
frappe.ui.form.on('Shipping Management Tool', {
    onload: function(frm) {
        // Hide the save button
        frm.disable_save();
    },
	ship_plan: function (frm) {
		refresh_scale_item(frm);
		},
});

frappe.ui.form.on("Scale Child", {
	scale_child_add: function (frm) {
		calculate_totals(frm);
	},
	qty: function (frm, cdt, cdn) {
		calculate_totals(frm);
	},
});

frappe.ui.form.on('Shipping Management Tool', {
	refresh: function (frm) {
		// Hide the save button
		frm.disable_save();
		//remove the menu 
		frm.page.clear_menu();
		//remove all fields value in this form except the company
		frm.clear_table
		//add a refresh button to refresh the scale child
		frm.add_custom_button(__('刷新物流单'), function () {
			if (!frm.doc.ship_plan) {
				frappe.throw(__('请先选择物流计划'));
				return;
			}
			refresh_scale_item(frm);
		});
		//set page primary action
		frm.page.set_primary_action(__('保存'), function () {

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
						let saved_doc = r.message;
						frm.doc.name = saved_doc.name;
						frappe.msgprint("保存成功");
						refresh_scale_item(frm);
						frm.doc.__unsaved = false;
						frm.refresh();
						}
					}
				}
			});
		});

		// Empty the sidebar to avoid duplicating items on refresh
		frm.page.sidebar.empty();
		// Create a search box and prepend it to the sidebar
		var $search_box = $('<input type="text" placeholder="Search Vehicles..." class="form-control sidebar-search-box">')
			.prependTo(frm.page.sidebar)
			.on('input', function () {
				var search_value = $(this).val().toLowerCase();
				// Filter the vehicle list based on the search
				$('.custom-sidebar-multiselect label').each(function () {
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
		// default company
		var company = frappe.defaults.get_user_default("Company");
		// Fetch the vehicles
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'Vehicle',
				fields: ['name', 'id'], // Retrieve both 'name' and 'id'
				order_by: 'id asc',
				filters: {
					'company': company
				}
			},
			callback: function (r) {
				if (r.message) {
					// Add checkboxes and information to the container for each vehicle
					$.each(r.message, function (i, vehicle) {
						var $checkbox_wrapper = $('<div class="vehicle-row">').appendTo($multi_select_container);

						// Create a checkbox for each vehicle
						var $checkbox = $('<input type="checkbox" class="vehicle-checkbox">')
							.data('vehicle-id', vehicle.id) // Store the vehicle ID
							.data('vehicle-name', vehicle.name) // Store the vehicle name
							.appendTo($checkbox_wrapper);

						// Display vehicle ID
						var $id_span = $('<span class="vehicle-id">').text(vehicle.id).appendTo($checkbox_wrapper);

						// Display vehicle name (you can concatenate it with ID or keep it separate)
						var $name_span = $('<span class="vehicle-name">').text(vehicle.name).appendTo($checkbox_wrapper);

						// Handle checkbox click event
						$checkbox.on('click', function () {
							// Get all selected vehicles
							var selected_vehicles = [];
							$multi_select_container.find('.vehicle-checkbox:checked').each(function () {
								var vehicleId = $(this).data('vehicle-id');
								var vehicleName = $(this).data('vehicle-name');
								selected_vehicles.push({
									id: vehicleId,
									name: vehicleName
								});
							});
							// Do something with the selected vehicles
							console.log('Selected vehicles:', selected_vehicles);
						});
					});
				}
			}
		});


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
			if (!frm.doc.ship_plan) {
				frappe.throw(__('请先选择物流计划'));
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
								qty:scale_child_data.qty,
								from_addr:frm.doc.from_addr,
								to_addr:frm.doc.to_addr,
								driver:scale_child_data.driver,
								
								
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
		
	},
});

function calculate_totals(frm) {
	//calculate the total qty from scale child table
	let total_qty = 0;
	for (let row of frm.doc.scale_child) {
		total_qty += row.qty;
	}
	frm.doc.assigned_qty = total_qty;
	frm.doc.__unsaved = true;
	frm.refresh();
}


function refresh_scale_item(frm){
	//get all scale item related to this ship_plan
	frappe.call({
		method: "shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.get_scale_childs", // Replace with your app and module names
		args: {
			"ship_plan": frm.doc.ship_plan // Pass the ship_plan from the current form
		},
		callback: function (r) {
			if (r.message) {
				// You now have the scale item data returned from the server
				let scale_item_data = r.message;
				//clear all scale_child table
				frm.clear_table('scale_child');
				//add scale item to the child table
				for (let row of scale_item_data) {
					frm.add_child('scale_child', {
						scale_item: row.name,
						qty: row.target_weight,
						vehicle: row.vehicle,
						from_addr: row.from_addr,
						to_addr: row.to_addr,
						driver: row.driver,
						status: row.status,
						id: row.id
					});
				}
				frm.refresh_field('scale_child');
				calculate_totals(frm);
			}
		}
	});
}