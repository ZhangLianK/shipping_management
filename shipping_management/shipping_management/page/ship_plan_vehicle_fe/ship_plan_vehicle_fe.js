frappe.pages['ship-plan-vehicle-fe'].on_page_load = function (wrapper) {
	$(wrapper).empty();
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: '物流分量',
		single_column: true
	});
	var css = `.content-wrapper {
		display: flex;
		flex-direction: column;
		/* Adjust this based on your header/footer height to ensure it fills the screen */
	}
	
	.scale-items-container {
		overflow-y: auto;
		flex-grow: 1; /* Allows the container to expand and fill available space */
		padding-bottom: 60px; /* Provide space for the fixed-position buttons */
	}

	.scale-item-group-header {
		margin-top: 20px;
		padding: 10px;
		background-color: grey; /* Bootstrap primary color for example */
		color: white;
		border-radius: 5px;
		font-size: 12px;
		font-weight: bold;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		border: 1px solid #0056b3; /* A slightly darker blue */
	}
	
	.scale-item {
		margin-bottom: 10px;
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}

	.scale-item.selected {
		background-color: #f0f0f0; /* Light grey background for selected items */
		border-color: #007bff; /* Optionally change the border color */
	}
	
	.footer-buttons {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		background-color: white;
		box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
		display: flex;
		justify-content: center;
		padding: 10px 0;
	}
	
	.btn {
		margin: 0 10px;
	}
	.ship-plan-info {
		margin-bottom: 10px;
		top: 0;
		background-color: white;
		z-index: 1000; /* Ensure it stays on top */
		padding: 10px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}
	.vehicles-container {
		display: flex;
		flex-direction: column;
		margin-top: 10px;
	}
	
	.vehicle-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px;
		margin-bottom: 5px;
		border: 1px solid #ccc;
		cursor: pointer;
	}
	
	.vehicle-card.selected {
		background-color: #e0e0e0; /* Highlight color for selected vehicles */
	}
	
	.qty-adjust button {
		margin: 0 5px;
		background-color: #f0f0f0;
		border: none;
		padding: 5px 10px;
		cursor: pointer;
	}
	
	.vehicle-info {
		display: flex;
		align-items: center;
	}
	
	.vehicle-qty .vehicleid .vehicle-id {
		margin-left: 5px;
	}

	.input-qty {
		width: 30px;
		text-align: center;
	}

	.warehouse-tree ul {
		list-style-type: none;
		padding: 0;
		font-size: medium;
	}
	
	.warehouse-tree li {
		cursor: pointer;
		margin: 5px 0;
		padding-left: 20px;
		position: relative;
		font-size: medium;
	}
	
	.warehouse-tree li:before {
		content: "\u25B6"; /* Right-pointing triangle */
		position: absolute;
		left: 0;
		transform: rotate(0deg); /* Point down when active */
	}


	
	.warehouse-tree li.active:before {
		transform: rotate(90deg); /* Rotate back to right-pointing */
	}
	
	/* Hide child warehouses initially */
	.warehouse-selection {
		display: none;
	}

	.warehouse-selection li:before {
		content: "\u2022"; /* Bullet point */
		position: absolute;
		left: 0;
	}

	.warehouse-tree li:hover {
		background-color: #f0f0f0;
	}
	/* Style for selected warehouse */
	.selected-warehouse {
		font-size: 1.2em;
		font-weight: bold;
		border: 1px solid #ccc; 
		margin-bottom: 10px; 
		padding: 10px; 
		border-radius: 5px;
	}
	
	/*add success style for selected scale item card success */
	.scale-item-card.success {
		background-color: #d4edda;
		border-color: #c3e6cb;
	}

	.scale-item-card.fail {
		background-color: #f8d7da;
		border-color: #f5c6cb;
	}

	/* Base styles for the dropdown */
	#sales-order-select {
	    display: block;
	    width: 100%;
	    padding: 8px 12px;
	    margin-bottom: 10px;
	    font-size: 16px; /* Adjust this value if needed */
	    line-height: 1.5;
	    color: #495057;
	    background-color: #fff;
	    background-clip: padding-box;
	    border: 1px solid #ced4da;
	    border-radius: 4px;
	    transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
	}

	#sales-order-select:focus {
	    border-color: #80bdff;
	    outline: 0;
	    box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
	}

	#sales-order-select option {
	    padding: 6px;
	}
	.control-label {
		font-weight: bold;
		font-size: medium;
	}

	.sales-order-assignment-container li span {
		font-size: medium
	}`;	
	var head = document.head || document.getElementsByTagName('head')[0];
	var style = document.createElement('style');
	head.appendChild(style);
	style.type = 'text/css';
	if (style.styleSheet) {
		// This is required for IE8 and below.
		style.styleSheet.cssText = css;
	} else {
		style.appendChild(document.createTextNode(css));
	}

	//const route = frappe.get_route();
	const ship_plan_name = frappe.route_options.ship_plan;
	const transporter = frappe.route_options.transporter;


	init_page(wrapper, ship_plan_name, transporter);

	if (!ship_plan_name) {
		//clear all containers
		$('.ship-plan-info').empty();
		$('.scale-items-container').empty();
		$('.vehicles-container').empty();
	}
	page.set_primary_action(__('Refresh'), function () {
		fetchAndDisplayScaleItems();
	}, 'refresh');
};

frappe.pages['ship-plan-vehicle-fe'].on_page_show = function (wrapper) {
	//const route = frappe.get_route();
	const ship_plan_name = frappe.route_options.ship_plan;
	const transporter = frappe.route_options.transporter;
	// Fetch and display scale items whenever the page is shown
	if (ship_plan_name) {
		display_ship_plan_info();
		fetchAndDisplayScaleItems();
	}
	init_buttons();
	init_warehouse_container();
	init_sales_order_container();
};


function fetchAndDisplayScaleItems() {
	//const route = frappe.get_route();
	const ship_plan_name = frappe.route_options.ship_plan;
	let transporter = frappe.route_options.transporter;
	if (transporter == '') {
		transporter = undefined;
	}
	//clear ship plan info and regenerate it

	// Assuming `fetchScaleItems` is your method to get scale items from the server
	frappe.db.get_list('Scale Item', {
		filters: {
			ship_plan: ship_plan_name,
			transporter: transporter,
			status: ['!=', '9 已取消']
		},
		fields: ['vehicle', 'target_weight', 'status', 'name', 'to_addr', 'type', 'bill_type', 'sales_order', 'pot', 'order_note'],
		order_by: 'type desc, creation asc',
		limit: 'all'
	}).then(function (r) {

		if (r) {
			//calculate the total target_weight of the scale items
			let total_target_weight = 0;
			r.forEach(item => {
				total_target_weight += parseFloat(item.target_weight);
			});

			// Clear existing items
			$('.scale-items-container').empty();
			// Display each scale item in the container
			display_scale_items(r);
			$('.scale-items-container').show();
			$('#total_target').text(total_target_weight);
		}

	});
}
function display_ship_plan_info() {
	const shipPlanName = frappe.route_options.ship_plan;
	const transporterName = frappe.route_options.transporter;
	$('.ship-plan-info').empty();
	frappe.db.get_doc('Ship Plan', shipPlanName).then(doc => {
		$('.ship-plan-info').append(`
			<h3>
			<span>${doc.date}</span>
			<span style="float:right">${doc.plan_desc}</span>
			</h3>
			<p><span id="transporter-name">承运商：${transporterName ? transporterName : '所有'}</span>
			<span id="ship-plan-name" style="float:right">${doc.name}</span>
			</p>
			<p><span>计划总量: ${doc.qty} 吨</span>
			<span style="float:right">总配车量:${doc.assigned_qty} 吨</span></p>
			<span id="baohao_template" style = "display:none">${doc.baohao_template ? doc.baohao_template : ''}</span>
		`);
	});
}

//tem_type = item.type == 'IN'? '入库':item.type == 'OUT'?'出库': item.type == 'DIRC'?'外卖':'其他';

function groupScaleItems(scale_items) {
	const groupedItems = {};

	scale_items.forEach(item => {
		const groupKey = `${item.pot}-${item.sales_order}`;
		if (!groupedItems[groupKey]) {
			let pot = '';
			if (item.pot){
				const pots = item.pot.split(' - ');
				if (pots.length == 3){
					pot = pots[0]+pots[1];
				} else {
					pot = pots[0];
				}
			}
			const groupDesc = `【${pot}】-【${item.order_note ? item.order_note : ''}】`;
			groupedItems[groupKey] = {
				items: [],
				totalWeight: 0, // Initialize total weight for the group
				groupDesc: `${groupDesc}`
			};
		}

		groupedItems[groupKey].items.push(item);
		groupedItems[groupKey].totalWeight += parseFloat(item.target_weight); // Sum up the target_weight
	});

	return groupedItems;
}


function display_scale_items(scale_items) {
    $('.scale-items-container').empty(); // Clear previous items

    const groupedItems = groupScaleItems(scale_items);

    Object.keys(groupedItems).forEach((groupKey, groupIndex) => {
        const group = groupedItems[groupKey];
        const groupHeader = $(`
            <div class="scale-item-group-header" style="cursor: pointer;">
                ${group.groupDesc} - 【合计: ${group.totalWeight.toFixed(2)} 吨】
            </div>
        `);

        // Create a container for the items in this group, initially hidden
        const groupContainer = $('<div class="scale-item-group" style="display: none;"></div>');

        // Render items in the group
        group.items.forEach((item, index) => {
            const $itemHtml = $(`
                <div class="scale-item" data-item-name="${item.name}">
                    <div class="item-header">
                        <div>
                            <h5>${groupIndex + 1}.${index + 1}. <span data-item-vehicle="${item.vehicle}">${item.vehicle}</span>
							<span class="status-label" style="float: right;" data-type="${item.type}">
								${item.type == 'DIRC' ? '外卖' : item.type == 'IN'? "入库": item.type == 'OUT' ? "出库" : '其他'}
							</span>
                            </h5>
                        </div>
                    </div>
                    <div class="item-body" style="display: flex; justify-content: space-between;">
                        <div>
                            <span data-target-weight="${item.target_weight}">预装量: ${item.target_weight}</p>
                            <p>车辆状态:${item.status}</p>
                        </div>
                        <div style="text-align: right;">
                            <p>单号: ${item.name}</p>
                            <p>卸车地: ${item.to_addr ? item.to_addr : ''}</p>
                        </div>
                    </div>
                </div>
            `);

            // Attach click event handler as before
            $itemHtml.click(function () {
                $(this).toggleClass('selected');
                const selectedItems = $('.scale-item.selected').length;
                if (selectedItems > 1) {
                    $('.edit-btn').hide();
                } else if (selectedItems == 1) {
                    $('.edit-btn').show();
                } else {
                    $('.edit-btn').hide();
                }
            });

            // Append item to the group container instead of directly to the scale-items-container
            groupContainer.append($itemHtml);
        });

        // Append the group header and container to the scale-items-container
        $('.scale-items-container').append(groupHeader).append(groupContainer);

        // Attach click event to toggle visibility of the group container
        groupHeader.click(function() {
            $(this).next('.scale-item-group').slideToggle();
        });
    });
}

function checkScaleItemsSelected() {
	const selectedItems = $('.scale-item.selected').length;
	if (selectedItems == 0) {
		frappe.msgprint(__('请选择要分配的物流单号'));
		return false;
	}
	return true;
}


//add a parameter to this function so that the function can be used to display selected scale items for sales order
function displaySelectedScaleItems(wrapper) {
	const selectedItemsContainer = wrapper
	selectedItemsContainer.empty(); // Clear previous selections
	let totalWeight = 0;
	//check if there is any selected scale item
	$('.scale-item.selected').each(function () {
		const itemName = $(this).data('item-name');
		const vehicleName = $(this).find('[data-item-vehicle]').data('item-vehicle'); // Assuming vehicle name is stored as data attribute
		const target_weight = $(this).find('[data-target-weight]').data('target-weight');
		totalWeight += parseFloat(target_weight);
		// Create a card for each selected item
		const itemCard = $(`
            <div class="scale-item-card" data-item-name="${itemName}" style="border: 1px solid #ccc; margin-bottom: 10px; padding: 10px; border-radius: 5px;">
                <div>
					<span>车号: ${vehicleName}</span>
					<span style = 'padding-left: 20px;'>${target_weight}吨</span>
					<span style = 'float:right'>单号: ${itemName}</span>
				</div>
            </div>
        `);
		selectedItemsContainer.append(itemCard);
	});
	wrapper.closest('.sales-order-assignment-container').find('#total_target').text(totalWeight.toFixed(2) + '吨');
}

// Example function to load warehouse groups
function loadWarehouseGroups() {
	$('.warehouse-group-selection').empty()
	// Assume getWarehouseGroups() fetches your warehouse group data
	frappe.db.get_list("Warehouse", {
		fields: ["name"],
		filters: {
			"is_group": 1
		},
	}).then(function (r) {
		if (!r.exc) {
			r.forEach(group => {
				//if the group is All Warehouses, skip it
				if (group.name.split(' - ')[0] != 'All Warehouses') {
					$('.warehouse-group-selection').append(`<li class="warehouse-group" data-group-name="${group.name}">${group.name}</li>`);
				}
			});
		}
		$('.warehouse-group').click(function () {
			const groupName = $(this).data('group-name');
			//check if the group is already active
			if ($(this).hasClass('active')) {
				//if it is active, then hide the warehouse selection
				$('.warehouse-selection').hide();
				//remove the active class
				$(this).removeClass('active');
				return;
			}
			// Clear previous selection and mark the current as active
			$('.warehouse-group').removeClass('active');
			$(this).addClass('active');

			// Assume getChildWarehouses(groupName) fetches children for the group
			//move warehouse selection ul to the position after the warehouse group li that is active
			$('.warehouse-selection').remove();
			$('<ul class="warehouse-selection"></ul>').insertAfter($('.warehouse-group.active'));
			getChildWarehouses(groupName);
			$('.warehouse-selection').show();
		});
	});

}


// Dummy function to simulate fetching child warehouses for a group
function getChildWarehouses(groupName) {
	// This would be replaced by actual fetching logic based on groupName
	frappe.db.get_list("Warehouse", {
		fields: ["name"],
		filters: {
			"parent_warehouse": groupName
		},
	}).then(function (r) {

		if (!r.exc) {
			r.forEach(warehouse => {
				$('.warehouse-selection').append(`<li class='child'>${warehouse.name}</li>`);

			});
			//add click event to the warehouse selection,set the selected warehouse to the selected-warehouse div
			$('.warehouse-selection li').click(function () {
				$('.warehouse-selection li').removeClass('active');
				$(this).addClass('active');
				$('.selected-warehouse span').text($(this).text());
				$('.selected-warehouse').data('warehouse', $(this).text());
			});
		}
	});
}


function fetchAndPopulateSalesOrderDropdown() {
	frappe.db.get_list('Sales Order', {
		fields: ['name', 'order_note'],
		filters: {
			'status': ['not in', ['Completed', 'Closed']]
		},
		limit: 'all'
	}).then(salesOrders => {
		const selectElement = $('#sales-order-select');
		selectElement.empty(); // Clear existing options

		salesOrders.forEach(order => {
			let order_name_ls = order.name.split('-');
			const optionText = `${order_name_ls[2]}-${order_name_ls[3]} -- ${order.order_note?order.order_note:''}`;
			selectElement.append(new Option(optionText, order.name));
		});
	});
}


function addSalesOrderField(){
	$('.sales-order-selection').empty()
	parentwrapper = $('#page-ship-plan-vehicle-fe').find('.sales-order-selection');
	let salesOrderField = frappe.ui.form.make_control({
        parent: parentwrapper,
        df: {
            label: '销售订单',
            fieldtype: 'Link',
            options: 'Sales Order',
			get_query: function () {
				let ship_plan_name = frappe.route_options.ship_plan;
				return {
					query: 'shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.get_filtered_sales_orders',
					filters: {
						'ship_plan': ship_plan_name
					}
				}
			},
            onchange: function() {
				// Action to take when a Sales Order is selected
				console.log('Selected Sales Order:', this.get_value());
				//get the selected sales order
				const selectedSalesOrder = this.get_value();
				//get the ship plan name from route options
				const ship_plan_name = frappe.route_options.ship_plan;
				//get the order note of the selected sales order
				frappe.db.get_value('Sales Order', selectedSalesOrder, 'order_note').then(r => {
					if (r) {
						$('#order_note').text(r.message.order_note);
					}
				});
			
				// Fetch a Ship Plan Item based on the selected Sales Order and Ship Plan
				frappe.db.get_list('Ship Plan Item', {
					fields: ['name', 'sales_order', 'parent', 'to_addr'], // Specify the fields you want to fetch
					filters: {
						'sales_order': selectedSalesOrder,
						'parent': ship_plan_name
					},
					limit: 1 // Assuming you want to fetch only one matching Ship Plan Item
				}).then(shipPlanItems => {
					if (shipPlanItems && shipPlanItems.length > 0) {
						// Found at least one matching Ship Plan Item
						const shipPlanItem = shipPlanItems[0]; // Take the first one since limit is 1
						console.log('Found Ship Plan Item:', shipPlanItem);
						// Perform further actions as needed, e.g., display some details on the UI
						//set the item's to_addr to the input field
						$('.to-addr input').val( shipPlanItem.to_addr);
					} else {
						// No matching Ship Plan Item found
						console.log('No matching Ship Plan Item found for selected Sales Order and Ship Plan.');
					}
				});
			}
			
        },
        render_input: true
    });

    salesOrderField.refresh();
}
function addToAddrField(){
	$('.to-addr').empty()
	parentwrapper = $('#page-ship-plan-vehicle-fe').find('.sales-order-selection');
	let toAddr = frappe.ui.form.make_control({
        parent: parentwrapper,
        df: {
            label: '送货地',
            fieldtype: 'Data',
        },
        render_input: true
    });

    toAddr.refresh();
}


function init_page(wrapper, shipPlanName, transporterName) {
	// Calculate the desired height (you might want to subtract any fixed header/footer heights)
	const desiredHeight = window.innerHeight - 100; // Example: subtract 100px for header/footer

	// Wrapper for the scrollable list and the fixed-position buttons
	const contentWrapper = $('<div class="content-wrapper" style="height: ' + desiredHeight + 'px"></div>');
	$(wrapper).find('.layout-main-section').html(contentWrapper);

	const shipPlanInfo = $(`
        <div class="ship-plan-info">
        </div>
		<div class = "total_target">
		<p style = "font-weight:bold;">当前列表总量: <span  id = "total_target">
		</span> 吨</p>
		</div>
    `);
	//clear ship plan info and regenerate it
	contentWrapper.append(shipPlanInfo);
	//display_ship_plan_info();
	// Container for the scrollable list of items
	const container = $('<div class="scale-items-container"></div>');
	contentWrapper.append(container);

	// Buttons fixed at the bottom
	const buttonsHtml = `
        <div class="footer-buttons">
        </div>
    `;
	contentWrapper.append(buttonsHtml);

}

function fetchAndDisplayVehicles() {
	let transporter = frappe.route_options.transporter;
	if (!transporter) {
		transporter = frappe.user_defaults.default_transporter;
	}
	frappe.db.get_list('Vehicle', {
		filters: {
			transporter: transporter
		},
		fields: ['name', 'standard_qty', 'id', 'wheels'],
		limit: 'all'
	}).then(function (r) {
		if (r) {
			displayVehicles(r);
		}

	});
}

function displayVehicles(vehicles) {
	//check if the vehicles container is already present
	if ($('.vehicles-container').length) {
		$('.vehicles-container').remove();
	}
	const vehiclesContainer = $('<div class="vehicles-container"></div>').appendTo('.content-wrapper');
	vehicles.forEach(vehicle => {
		const vehicleCard = $(`
            <div class="vehicle-card" data-vehicle-id="${vehicle.name}" style="${vehicle.wheels == 0 ? 'color: green;' : 'color: black;'}">
                <div class="vehicle-info">
                    <span class= "vehicleid">${vehicle.id} </span>--<span class= "vehicle-id">${vehicle.name}</span>--<span class="vehicle-qty">${vehicle.standard_qty}</span>
					--<span class="vehicle-processing">${vehicle.wheels}</span>
                </div>
                <div class="qty-adjust">
                    <button class="qty-decrease">-</button>
					<input type="text" class="input-qty" value=${vehicle.standard_qty} style="width: 50px; text-align: center;" />
                    <button class="qty-increase">+</button>
                </div>
            </div>
        `).appendTo(vehiclesContainer);

		// Decrease Qty
		vehicleCard.find('.qty-decrease').click(function (e) {
			e.stopPropagation(); // Prevent the vehicle-card click event
			const qtyInput = $(this).closest('.vehicle-card').find('.input-qty');
			let qty = parseFloat(qtyInput.val());
			if (qty > 0) { // Optional: prevent qty from going below a certain value (e.g., 0)
				qtyInput.val(--qty);
			}
		});

		// Increase Qty
		vehicleCard.find('.qty-increase').click(function (e) {
			e.stopPropagation(); // Prevent the vehicle-card click event
			const qtyInput = $(this).closest('.vehicle-card').find('.input-qty');
			let qty = parseFloat(qtyInput.val());
			qtyInput.val(++qty);
		});

		// Handle vehicle selection
		vehicleCard.click(function () {
			$(this).toggleClass('selected'); // Highlight selected vehicle
		});
	});

	// Modify the assign button for saving selected vehicles with their quantities
	// Update your saveSelectedVehiclesToShipPlan function as needed to include quantities
}

function saveSelectedVehiclesToShipPlan(selectedVehicles) {
	//get shipPlanName from the ship-plan-info
	const shipPlanName = $('#ship-plan-name').text();
	if (shipPlanName) {
		frappe.call({
			method: 'shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.save_scale_item_m', // Adjust with your actual method path
			args: {
				ship_plan_name: shipPlanName, // Ensure you have this variable available
				vehicles: selectedVehicles
			},
			callback: function (r) {
				if (r.message == 'success') {
					// Handle success (e.g., show a success message, refresh the page)
					console.log("Success", r.message);
					$('.save-btn').hide();
					//hide the vehicles container and show the scale items container
					$('.vehicles-container').hide();
					fetchAndDisplayScaleItems();
				}
			}
		});
	}
}

//init the buttons in the bottom
function init_buttons() {
	const buttons_wrapper = $('.footer-buttons');
	//remove all buttons
	buttons_wrapper.empty();

	$('#page-ship-plan-vehicle-fe').find('.footer-buttons').append(`
		<button class="btn back-btn">返回</button>
		<button class="btn btn-primary save-btn" style="display: none;">保存</button>
		<button class="btn btn-secondary edit-btn" style="display: none;">更改</button>
		<button class="btn assign-warehouse-btn">入库</button>
		<button class="btn assign-sales-order-btn btn-secondary">外卖</button>
		<button class="btn btn-primary save-so-btn" style="display: none;">保存</button>
	`);

	$('.assign-sales-order-btn').click(function () {
		//chekc if any scale item is selected
		if (!checkScaleItemsSelected()) {
			return;
		}
		else {
			$('#order_note').text('');
			$('.scale-items-container').hide();
			displaySelectedScaleItems($('.selected-scale-items-so')); // Update the list of selected scale items for assignment
			//fetchAndPopulateSalesOrderDropdown(); // Populate the sales order dropdown
			addSalesOrderField();
			addToAddrField();
			$('.sales-order-assignment-container').show(); // Show the container
			$('.assign-sales-order-btn').hide()
			$('.assign-warehouse-btn').hide()
			$('.edit-btn').hide();
			$('.cancel-btn').hide();
			$('.save-so-btn').show();
			$('.back-btn').off('click');
			$('.back-btn').click(function () {
				$('.save-so-btn').hide();
				$('.cancel-btn').show();
				$('.assign-warehouse-btn').show();
				$('.assign-sales-order-btn').show();
				$('.warehouse-selection-container').hide();
				$('.sales-order-assignment-container').hide()
				$('.scale-items-container').show();

				fetchAndDisplayScaleItems();
				//reset back-btn so that it can go back to the ship-plan-list,clear all other click events
				$('.back-btn').off('click');
				//hide save button
				$('.save-btn').hide();
				$('.back-btn').click(function () {
					frappe.set_route('ship-plan-list-fen');
				});

			});
		}
	});





	$('.assign-warehouse-btn').click(function () {
		if (!checkScaleItemsSelected()) {
			return;
		}
		else {
			//hide scale items list container
		$('.scale-items-container').hide();
		loadWarehouseGroups();
		displaySelectedScaleItems($('.selected-scale-items')); // Update the list of selected scale items for assignment
		// Show the warehouse selection container
		$('.warehouse-selection-container').show();
		$('.assign-warehouse-btn').hide()
		$('.assign-sales-order-btn').hide()
		$('.save-btn').show()
		$('.edit-btn').hide();
		$('.cancel-btn').hide();

		//reset back-btn so that it can go back to the scale items,clear all other click events
		$('.back-btn').off('click');
		$('.back-btn').click(function () {
			$('.cancel-btn').show();
			$('.assign-sales-order-btn').show();
			$('.assign-warehouse-btn').show();
			$('.warehouse-selection-container').hide();
			$('.scale-items-container').show();

			fetchAndDisplayScaleItems();
			//reset back-btn so that it can go back to the ship-plan-list,clear all other click events
			$('.back-btn').off('click');
			//hide save button
			$('.save-btn').hide();
			$('.back-btn').click(function () {
				frappe.set_route('ship-plan-list-fen');
			});

		});

		}
	});


	$('.edit-btn').click(function () {
		//get the selected scale item
		const selectedScaleItem = $('.scale-item.selected').data('item-name');
		console.log('Edit button clicked', selectedScaleItem);
		//get the selected scale item and open the edit form
		frappe.route_options['tab'] = "scale-item-details";
		frappe.set_route(['Form', 'Scale Item', selectedScaleItem]);
	});

	$('.back-btn').click(function () {
		frappe.set_route('ship-plan-list-fen');
	});

	$('.save-so-btn').click(function () {
		//collect all scale items in selected-scale-items div
		const selectedScaleItems = $('.selected-scale-items-so .scale-item-card').map(function () {
			return $(this).data('item-name');
		}
		).get();
		//get the name of the selected sales order
		const selectedSalesOrder = $('.sales-order-selection input').val();
		if (!selectedSalesOrder) {
			frappe.msgprint(__('请选择销售订单'));
			return;
		}
		const toAddr = $('.to-addr input').val();
		if (!toAddr) {
			frappe.msgprint(__('请输入送货地'));
			return;
		}
		if (selectedScaleItems.length > 0 && selectedSalesOrder) {
			// Call the server-side method to assign these scale items to the selected sales order
			frappe.call({
				method: 'shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.assign_sales_order_to_scale_items', // Adjust this to your server-side method's actual path
				args: {
					scale_items: selectedScaleItems,
					sales_order: selectedSalesOrder,
					to_addr: toAddr
				},
				callback: function (r) {
					if (r.message) {
						for (let result of r.message) {
							// Handle each result as needed
							if (result.status === 'success') {
								// Optionally, remove the cancelled items from the UI
								//add success mark to the scale item card
								$('.selected-scale-items-so .scale-item-card[data-item-name="' + result.scale_item + '"]').addClass('success');
							}
							else {
								frappe.msgprint(__('外卖配单失败，单号：' + result.scale_item + '车号：' + result.vehicle));
								//add fail mark to the scale item card
								$('.selected-scale-items-so .scale-item-card[data-item-name="' + result.scale_item + '"]').addClass('fail');
							}
						}
					}
				}
			});
		}
	});

	$('.save-btn').click(function () {
		//collect all scale items in selected-scale-items div
		const selectedScaleItems = $('.selected-scale-items .scale-item-card').map(function () {
			return $(this).data('item-name');
		}
		).get();
		//get the name of the selected warehouse
		const selectedWarehouse = $('.selected-warehouse').data('warehouse');

		if (selectedScaleItems.length > 0 && selectedWarehouse) {
			// Call the server-side method to assign these scale items to the selected warehouse
			frappe.call({
				method: 'shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.assign_warehouse_to_scale_items', // Adjust this to your server-side method's actual path
				args: {
					scale_items: selectedScaleItems,
					warehouse: selectedWarehouse
				},
				callback: function (r) {
					if (r.message) {
						for (let result of r.message) {
							// Handle each result as needed
							if (result.status === 'success') {
								// Optionally, remove the cancelled items from the UI
								//add success mark to the scale item card
								$('.selected-scale-items .scale-item-card[data-item-name="' + result.scale_item + '"]').addClass('success');
							}
							else {
								frappe.msgprint(__('入库配罐失败，单号：' + result.scale_item + '车号：' + result.vehicle));
								//add fail mark to the scale item card
								$('.selected-scale-items .scale-item-card[data-item-name="' + result.scale_item + '"]').addClass('fail');
							}
						}
					}
				}
			});
		}
	});
	$('.cancel-btn').click(function () {
		// Collect the names of all selected scale items
		const selectedScaleItemNames = $('.scale-item.selected').map(function () {
			return $(this).data('item-name'); // Assuming each .scale-item has a data attribute like data-item-name with the item's name
		}).get();

		if (selectedScaleItemNames.length > 0) {
			// Call the server-side method to cancel these scale items
			frappe.call({
				method: 'shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.cancel_scale_items', // Adjust this to your server-side method's actual path
				args: {
					scale_items: selectedScaleItemNames
				},
				callback: function (r) {
					if (r.message) {
						for (let result of r.message) {
							// Handle each result as needed
							if (result.status === 'success') {
								// Optionally, remove the cancelled items from the UI
								frappe.msgprint(__('Selected scale items have been cancelled.' + result.scale_item + result.vehicle));
							}
							else {
								frappe.msgprint(__('There was an issue cancelling the selected scale items.' + result.scale_item + result.vehicle));
							}
						}
					} else {
						// Handle error
						frappe.msgprint(__('There was an issue cancelling the selected scale items.'));
					}
					fetchAndDisplayScaleItems();
				}
			});
		} else {
			frappe.msgprint(__('No scale items selected.'));
		}
	});
}

function init_warehouse_container() {
	//remove all existing warehouse selection container
	$('.warehouse-selection-container').remove();
	// Inside your init_page function or appropriate setup function
	const warehouseSelectionContainer = $(`
		<div class="warehouse-selection-container" style="display:none;">
			<div class="warehouse-tree">
				<ul class="warehouse-group-selection"></ul>
			</div>
			<div class="selected-warehouse">罐（库位）:<span></span></div>
			<div class="selected-scale-items"></div>
		</div>
		`);

	// Append this container to the page
	$('#page-ship-plan-vehicle-fe').find('.content-wrapper').append(warehouseSelectionContainer);
}

function init_sales_order_container() {
	//remove all existing warehouse selection container
	$('.sales-order-assignment-container').remove();
	// Inside your init_page function or appropriate setup function
	const salesOrderAssignmentContainer = $(`
    <div class="sales-order-assignment-container" style="display:none;">
        <div class="sales-order-selection">
        </div>
		<div class ="to-addr">
		</div>
		<div class="control-label">订单备注：
		<span id="order_note"></span>
		</div>
		<div class="control-label">本次分配量：
		<span id="total_target"></span>
		</div>
		<div class="selected-scale-items-so"></div>
    </div>
`);

	// Append this container to the page
	$('#page-ship-plan-vehicle-fe').find('.content-wrapper').append(salesOrderAssignmentContainer);
}

