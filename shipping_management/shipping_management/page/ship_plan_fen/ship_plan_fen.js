frappe.pages['ship-plan-fen'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: '销售分量',
		single_column: true
	});
	var css = `.content-wrapper {
		display: flex;
		flex-direction: column;
		/* Adjust this based on your header/footer height to ensure it fills the screen */
	}
	
	.items-container {
		overflow-y: auto;
		flex-grow: 1; /* Allows the container to expand and fill available space */
		padding-bottom: 60px; /* Provide space for the fixed-position buttons */
	}
	
	.item {
		margin-bottom: 10px;
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}

	.item.selected {
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
		z-index: 1000;
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
		padding-left: 15px
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
	.qty-adjust-so button {
		margin: 0 5px;
		background-color: #f0f0f0;
		border: none;
		padding: 5px 10px;
		cursor: pointer;
	}

	.control-label {
		font-weight: bold;
		font-size: medium;
	}

	.sales-order-assignment-container li span {
		font-size: medium
	}
`;
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
		$('.items-container').empty();
		$('.vehicles-container').empty();
	}
};

frappe.pages['ship-plan-fen'].on_page_show = function (wrapper) {
	//const route = frappe.get_route();
	const ship_plan_name = frappe.route_options.ship_plan;
	const transporter = frappe.route_options.transporter;
	// Fetch and display scale items whenever the page is shown
	if (ship_plan_name) {
		display_ship_plan_info();
		fetchAndDisplayItems();
	}
};


function fetchAndDisplayItems() {
	//const route = frappe.get_route();
	const ship_plan_name = frappe.route_options.ship_plan;
	let transporter = frappe.route_options.transporter;
	if (transporter == '') {
		transporter = undefined;
	}
	//clear ship plan info and regenerate it

	// Assuming `fetchScaleItems` is your method to get scale items from the server
	frappe.db.get_doc('Ship Plan', ship_plan_name).then(doc => {
		//get the ship plan item info from field plan_items
		const plan_items = doc.plan_items;
		if (plan_items) {
			// Calculate the total v_qty
			let total_v_qty = 0;
			plan_items.forEach(item => {
				total_v_qty += item.v_qty;
			});
			// Clear existing items
			$('.items-container').empty();
			// Display each scale item in the container
			display_items(plan_items);
			$('.items-container').show();
			$('.assign-warehouse-btn').show();
			$('.assign-sales-order-btn').show();
			$('.cancel-btn').hide()
			$('.edit-btn').hide()
			//set the total v_qty in ship plan info
			$('#total_v_qty').text(total_v_qty);
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
			<span style="float:right">已配车量:${doc.assigned_qty} 吨</span></p>
			<span id="baohao_template" style = "display:none">${doc.baohao_template ? doc.baohao_template : ''}</span>
		`);
	});
}


function fetchItemDetails(itemName, callback) {
    frappe.db.get_doc('Ship Plan Item', itemName)
        .then(doc => {
            if (doc) {
                // Assuming doc contains the details you need
                // Call the callback function with the item details
                callback(doc);
            }
        })
        .catch(err => {
            console.error('Error fetching item details:', err);
            frappe.msgprint(__('Failed to fetch item details.'));
        });
}

function display_items(scale_items) {
	scale_items.forEach((item, index) => {
		// First, convert the HTML string into a jQuery object
		const $itemHtml = $(`
		    <div class="item" data-item-name="${item.name}">
		        <div class="item-header">
					<div>
		            	<h5 data-note="${item.type == 'DIRC' ? item.order_note : item.pot}">${index + 1}. ${item.type == 'DIRC' ? item.order_note : item.pot}
							<span class="status-label" style="float: right;" data-type="${item.type}">
								${item.type == 'DIRC' ? '外卖' : '入库'}
							</span>
						</h5>
					</div>
		        </div>
		        <div class="item-body" style="display: flex; justify-content: space-between;">
		            <div>
		                <p><span data-id = "${item.type == 'DIRC' ? item.sales_order : item.pot}">${item.type == 'DIRC' ? item.sales_order : item.pot}</span></p>
		                <p>送货地:<span data-to_addr ="${item.to_addr}">${item.to_addr}</span></p>
		            </div>
		            <div style="text-align: right;">
		                <p>车数: <span data-v_qty ="${item.v_qty}">${item.v_qty}</span></p>
		            </div>
		        </div>
		    </div>
		`);

		// Now, attach the click event handler to the jQuery object
		$itemHtml.click(function () {
			$(this).toggleClass('selected'); // Toggle the 'selected' class on click
			//check how many items are selected
			const selectedItems = $('.item.selected').length;
			if (selectedItems > 1) {
				$('.edit-btn').hide();
				$('.cancel-btn').show();
				$('.assign-warehouse-btn').hide();
				$('.assign-sales-order-btn').hide();
			} else if (selectedItems == 1) {
				$('.edit-btn').show();
				$('.cancel-btn').show();
				$('.assign-warehouse-btn').hide();
				$('.assign-sales-order-btn').hide();
			} else {
				//hide all edit buttons
				$('.edit-btn').hide();
				$('.cancel-btn').hide();
				$('.assign-warehouse-btn').show();
				$('.assign-sales-order-btn').show();
			}
		});
		// Finally, append the jQuery object to your container
		$('.items-container').append($itemHtml);

	});
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
			$('<ul class="warehouse-selection" style="padding-left:10px"></ul>').insertAfter($('.warehouse-group.active'));
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
			const optionText = `${order_name_ls[2]}-${order_name_ls[3]} -- ${order.order_note ? order.order_note : ''}`;
			selectElement.append(new Option(optionText, order.name));
		});
	});
}


function addSalesOrderField(selectedSalesOrder) {
	$('.sales-order-selection').empty()
	let salesOrderField = frappe.ui.form.make_control({
		parent: $('.sales-order-selection'),
		df: {
			label: '销售订单',
			fieldtype: 'Link',
			options: 'Sales Order',
			filters: {
				'status': ['not in', ['Completed', 'Closed', 'Cancelled']]
			},
			onchange: function () {
				// Action to take when a Sales Order is selected
				console.log('Selected Sales Order:', this.get_value());
				//get the selected sales order
				const selectedSalesOrder = this.get_value();
				//get the order note of the selected sales order
				frappe.db.get_value('Sales Order', selectedSalesOrder, 'order_note').then(r => {
					if (r) {
						$('#order_note').text(r.message.order_note);
					}
				});
			}
		},
		render_input: true
	});
	if (selectedSalesOrder){
		salesOrderField.set_input(selectedSalesOrder);
	}
	salesOrderField.refresh();
}
function addToAddrField(selectedToAddr) {
	$('.to-addr').empty()
	let toAddr = frappe.ui.form.make_control({
		parent: $('.to-addr'),
		df: {
			label: '送货地',
			fieldtype: 'Data',
		},
		render_input: true
	});
	if (selectedToAddr){
		toAddr.set_input(selectedToAddr);
	}
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
		<p style = "font-weight:bold;">当前列表总车数: <span  id = "total_v_qty">
		</span></p>
		</div>
    `);
	//clear ship plan info and regenerate it
	contentWrapper.append(shipPlanInfo);
	//display_ship_plan_info();
	// Container for the scrollable list of items
	const container = $('<div class="items-container"></div>');
	contentWrapper.append(container);
	const warehouseSelectionContainer = $(`
		<div class="warehouse-selection-container" style="display:none;">
			<div class="warehouse-tree">
				<ul class="warehouse-group-selection"></ul>
			</div>
			<div class="selected-warehouse">罐（库位）:<span></span></div>
			<div class="qty-adjust control-label">
			<span>车数:</span>
                    <button class="qty-decrease">-</button>
					<input type="number" class="input-qty" value=0 style="width: 50px; text-align: center;" />
                    <button class="qty-increase">+</button>
            </div>
			<div class="selected-item"></div>
		</div>
		`).appendTo('.content-wrapper');

	warehouseSelectionContainer.find('.qty-decrease').click(function (e) {
		e.stopPropagation(); // Prevent the vehicle-card click event
		const qtyInput = $(this).closest('.qty-adjust').find('.input-qty');
		let qty = parseFloat(qtyInput.val());
		if (qty > 0) { // Optional: prevent qty from going below a certain value (e.g., 0)
			qtyInput.val(--qty);
		}
	});

	warehouseSelectionContainer.find('.qty-increase').click(function (e) {
		e.stopPropagation(); // Prevent the vehicle-card click event
		const qtyInput = $(this).closest('.qty-adjust').find('.input-qty');
		let qty = parseFloat(qtyInput.val());
		qtyInput.val(++qty);
	});

	// Append this container to the page
	contentWrapper.append(warehouseSelectionContainer);

	const salesOrderAssignmentContainer = $(`
    <div class="sales-order-assignment-container" style="display:none;">
        <div class="sales-order-selection">
        </div>
		<div class ="to-addr">
		</div>
		<div class="control-label">订单备注：
		<span id="order_note"></span>
		</div>
		<div class="control-label qty-adjust-so">
		<span>车数:</span>
                    <button class="qty-decrease">-</button>
					<input type="number" class="input-qty-so" value=0 style="width: 50px; text-align: center;" />
                    <button class="qty-increase">+</button>
		</div>
		<div class="selected-item-so"></div>
    </div>
`).appendTo(contentWrapper);

	salesOrderAssignmentContainer.find('.qty-decrease').click(function (e) {
		e.stopPropagation(); // Prevent the vehicle-card click event
		const qtyInput = $(this).closest('.qty-adjust-so').find('.input-qty-so');
		let qty = parseFloat(qtyInput.val());
		if (qty > 0) { // Optional: prevent qty from going below a certain value (e.g., 0)
			qtyInput.val(--qty);
		}
	});

	salesOrderAssignmentContainer.find('.qty-increase').click(function (e) {
		e.stopPropagation(); // Prevent the vehicle-card click event
		const qtyInput = $(this).closest('.qty-adjust-so').find('.input-qty-so');
		let qty = parseFloat(qtyInput.val());
		qtyInput.val(++qty);
	});

	// append a container for change selectted item
	const editItemContainer = $(`
		<div class="edit-item-container" style="display:none;">
			<div class="control-label">name:</div>
			</div>
			<div class = "change-item">
			</div>
		`).appendTo(contentWrapper);

	// Buttons fixed at the bottom
	const buttonsHtml = `
        <div class="footer-buttons">
			<button class="btn back-btn">返回</button>
            <button class="btn btn-primary save-btn" style="display: none;">保存</button>
			<button class="btn btn-secondary cancel-btn">取消</button>
			<button class="btn btn-secondary edit-btn" style="display: none;">更改</button>
			<button class="btn assign-warehouse-btn">入库</button>
			<button class="btn assign-sales-order-btn btn-secondary">外卖</button>
			<button class="btn btn-primary save-so-btn" style="display: none;">保存</button>
			<button class="btn btn-secondary info-btn">概要</button>
        </div>
    `;
	contentWrapper.append(buttonsHtml);

	$('.assign-sales-order-btn').click(function () {
		//clear selected item
		$('.selected-item-so').empty();
		$('#order_note').text('');
		$('.input-qty-so').val(0);
		$('.items-container').hide();
		//displaySelectedScaleItems($('.selected-scale-items-so')); // Update the list of selected scale items for assignment
		fetchAndPopulateSalesOrderDropdown(); // Populate the sales order dropdown
		addSalesOrderField();
		addToAddrField();
		$('.sales-order-assignment-container').show(); // Show the container
		$('.assign-sales-order-btn').hide()
		$('.assign-warehouse-btn').hide()
		$('.edit-btn').hide();
		$('.cancel-btn').hide();
		$('.save-so-btn').show();
		$('.info-btn').hide();
		$('.back-btn').off('click');
		$('.back-btn').click(function () {
			$('.save-so-btn').hide();
			$('.cancel-btn').show();
			$('.assign-warehouse-btn').show();
			$('.assign-sales-order-btn').show();
			$('.info-btn').show();
			$('.warehouse-selection-container').hide();
			$('.sales-order-assignment-container').hide()
			$('.items-container').show();

			fetchAndDisplayItems();
			//reset back-btn so that it can go back to the ship-plan-list,clear all other click events
			$('.back-btn').off('click');
			//hide save button
			$('.save-btn').hide();
			$('.back-btn').click(function () {
				frappe.set_route('ship-plan-list-v');
			});

		});
	});

	$('.assign-warehouse-btn').click(function () {

		$('.input-qty').val(0);
		$('.selected-warehouse span').text('');
		//hide scale items list container
		$('.items-container').hide();
		loadWarehouseGroups();
		//displaySelectedScaleItems($('.selected-scale-items')); // Update the list of selected scale items for assignment
		// Show the warehouse selection container
		$('.warehouse-selection-container').show();
		$('.assign-warehouse-btn').hide()
		$('.assign-sales-order-btn').hide()
		$('.save-btn').show()
		$('.edit-btn').hide();
		$('.cancel-btn').hide();
		$('.info-btn').hide();

		//reset back-btn so that it can go back to the scale items,clear all other click events
		$('.back-btn').off('click');
		$('.back-btn').click(function () {
			$('.cancel-btn').show();
			$('.assign-sales-order-btn').show();
			$('.assign-warehouse-btn').show();
			$('.warehouse-selection-container').hide();
			$('.items-container').show();
			$('.info-btn').show();

			fetchAndDisplayItems();
			//reset back-btn so that it can go back to the ship-plan-list,clear all other click events
			$('.back-btn').off('click');
			//hide save button
			$('.save-btn').hide();
			$('.back-btn').click(function () {
				frappe.set_route('ship-plan-list-v');
			});

		});
	});


	$('.edit-btn').click(function () {
		//get selected item
		const selectedItemName = $('.item.selected').data('item-name');
		//get the selected card type
		const selectedCardType = $('.item.selected .status-label').data('type');
		//get the selected card sales order
		const selectedCardSalesOrder = $('.item.selected').find('span[data-id]').data('id');
		const selectedCardPot = selectedCardSalesOrder
		//get the to_addr
		const selectedCardToAddr = $('.item.selected').find('span[data-to_addr]').data('to_addr');
		//get the v_qty
		const selectedCardVQty = $('.item.selected').find('span[data-v_qty]').data('v_qty');
		//get the order_note
		const selectedCardOrderNote = $('.item.selected').find('h5').data('note');

		if (!selectedItemName) {
			frappe.msgprint(__('为选择任何分量项目'));
			return;
		}
		if (selectedCardType == 'DIRC') {
			//hide the item list container
			$('.items-container').hide();
			//display selected sales order
			$('.selected-item-so').empty();
			$('.selected-item-so').append(`<div class="item" data-item-name="${selectedItemName}">${selectedItemName}
			</div>`);
			// Populate the sales order dropdown
			addSalesOrderField(selectedCardSalesOrder);
			addToAddrField(selectedCardToAddr);
			$('.input-qty-so').val(selectedCardVQty);
			$('#order_note').text(selectedCardOrderNote);
			$('.sales-order-assignment-container').show();
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
				$('.items-container').show();

				fetchAndDisplayItems();
				//reset back-btn so that it can go back to the ship-plan-list,clear all other click events
				$('.back-btn').off('click');
				//hide save button
				$('.save-btn').hide();
				$('.back-btn').click(function () {
					frappe.set_route('ship-plan-list-v');
				});

			});
		}
		else {
			//hide the item list container
			$('.items-container').hide();
			//display selected sales order
			$('.selected-item').empty();
			$('.selected-item').append(`<div class="item" data-item-name="${selectedItemName}">${selectedItemName}
			</div>`);
			loadWarehouseGroups();
			$('.selected-warehouse span').text(selectedCardPot);
			$('.selected-warehouse').data('warehouse', selectedCardPot);
			$('.input-qty').val(selectedCardVQty);
			$('.warehouse-selection-container').show();
			$('.assign-warehouse-btn').hide()
			$('.assign-sales-order-btn').hide()
			$('.save-btn').show()
			$('.edit-btn').hide();
			$('.cancel-btn').hide();
			$('.back-btn').off('click');
			$('.back-btn').click(function () {
				$('.cancel-btn').show();
				$('.assign-sales-order-btn').show();
				$('.assign-warehouse-btn').show();
				$('.warehouse-selection-container').hide();
				$('.items-container').show();

				fetchAndDisplayItems();
				//reset back-btn so that it can go back to the ship-plan-list,clear all other click events
				$('.back-btn').off('click');
				//hide save button
				$('.save-btn').hide();
				$('.back-btn').click(function () {
					frappe.set_route('ship-plan-list-v');
				});

			});
		
		}
	});

	$('.back-btn').click(function () {
		frappe.set_route('ship-plan-list-v');
	});

	$('.save-so-btn').click(function () {
		//get the name of selected sales order
		const selectedSalesOrder = $('.sales-order-selection input').val();
		//get the qty of selected sales order
		const selectedSalesOrderQty = $('.input-qty-so').val();
		//get the ship plan name
		const shipPlanName = $('.ship-plan-info #ship-plan-name').text();
		//get the to_addr
		const toAddr = $('.to-addr input').val();
		//get order note
		const orderNote = $('#order_note').text();
		//get the selected item name
		const selectedItemName = $('.selected-item-so .item').data('item-name');
		//check if all value exists
		if (!selectedSalesOrder) {
			frappe.msgprint(__('请选择销售订单'));
			return;
		}
		if (!selectedSalesOrderQty) {
			frappe.msgprint(__('请输入车数'));
			return;
		}
		if (selectedItemName)
		{
			frappe.call({
				method: 'shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.update_sales_order_to_ship_plan', // Adjust this to your server-side method's actual path
				args: {
					ship_plan: shipPlanName,
					sales_order: selectedSalesOrder,
					v_qty: selectedSalesOrderQty,
					to_addr: toAddr,
					order_note: orderNote,
					item_name: selectedItemName
				},
				callback: function (r) {
					if (r.message) {
						if (r.message === 'success') {
							// Optionally, remove the cancelled items from the UI
							frappe.msgprint(__('此分量项目更新成功'));
							//trigger the back button click event
							$('.back-btn').click();
						}
						else {
							frappe.msgprint(__('此分量项目更新失败') + r.message);
						}
					}
				}
			});
		}
		else {
			frappe.call({
				method: 'shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.assign_sales_order_to_ship_plan', // Adjust this to your server-side method's actual path
				args: {
					ship_plan: shipPlanName,
					sales_order: selectedSalesOrder,
					v_qty: selectedSalesOrderQty,
					to_addr: toAddr,
					order_note: orderNote
				},
				callback: function (r) {
					if (r.message) {
						if (r.message === 'success') {
							// Optionally, remove the cancelled items from the UI
							frappe.msgprint(__('订单车数分配成功'));
							//trigger the back button click event
							$('.back-btn').click();
						}
						else {
							frappe.msgprint(__('订单车数分配失败') + r.message);
						}
					}
				}
			});
		}	
		
	});


	$('.save-btn').click(function () {
		//get the name of selected warehouse
		const selectedWarehouse = $('.selected-warehouse').data('warehouse');
		//get the qty of selected warehouse
		const selectedWarehouseQty = $('.input-qty').val();
		//get the ship plan name
		const shipPlanName = $('.ship-plan-info #ship-plan-name').text();
		//get the selected item name
		const selectedItemName = $('.selected-item .item').data('item-name');
		//check if all value exists
		if (!selectedWarehouse) {
			frappe.msgprint(__('请选择罐（库位）'));
			return;
		}
		if (!selectedWarehouseQty) {
			frappe.msgprint(__('请输入车数'));
			return;
		}
		if (selectedItemName) {
			//update the selected item with the selected warehouse and qty
			frappe.call({
				method: 'shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.update_warehouse_to_ship_plan', // Adjust this to your server-side method's actual path
				args: {
					ship_plan: shipPlanName,
					warehouse: selectedWarehouse,
					v_qty: selectedWarehouseQty,
					item_name: selectedItemName
				},
				callback: function (r) {
					if (r.message) {
						if (r.message === 'success') {
							// Optionally, remove the cancelled items from the UI
							frappe.msgprint(__('此分量项目更新成功'));
							//trigger the back button click event
							$('.back-btn').click();
						}
						else {
							frappe.msgprint(__('此分量项目更新失败') + r.message);
						}
					}
				}
			});
		}
		else {
			frappe.call({
				method: 'shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.assign_warehouse_to_ship_plan', // Adjust this to your server-side method's actual path
				args: {
					ship_plan: shipPlanName,
					warehouse: selectedWarehouse,
					v_qty: selectedWarehouseQty,
				},
				callback: function (r) {
					if (r.message) {
						if (r.message === 'success') {
							// Optionally, remove the cancelled items from the UI
							frappe.msgprint(__('计划默认【罐（库位）】分配成功'));
							//trigger the back button click event
							$('.back-btn').click();
						}
						else {
							frappe.msgprint(__('计划默认【罐（库位）】分配失败') + r.message);
						}
					}
				}
			});
		}
		
	});

	$('.cancel-btn').click(function () {
		// Collect the names of all selected scale items
		const selectedItemNames = $('.item.selected').map(function () {
			return $(this).data('item-name'); // Assuming each .scale-item has a data attribute like data-item-name with the item's name
		}).get();
		//get ship plan name
		const shipPlanName = $('.ship-plan-info #ship-plan-name').text();
		if (selectedItemNames.length > 0) {
			// Call the server-side method to cancel these scale items
			frappe.call({
				method: 'shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.cancel_ship_plan_items', // Adjust this to your server-side method's actual path
				args: {
					ship_plan:shipPlanName,
					items: selectedItemNames
				},
				callback: function (r) {
					if (r.message.status == 'success') {
							frappe.msgprint(__('成功删除分量项目 {0} 个', [r.message.success_count]));
					} else {
						// Handle error
						frappe.msgprint(__('删除分量项目失败' + r.message.error));
					}
					fetchAndDisplayItems();
				}
			});
		} else {
			frappe.msgprint(__('No scale items selected.'));
		}
	});

	$('.info-btn').click(function () {
		//according to the item card info, generate text with following format
		//1. order_note, to_addr, v_qty, sales_order

		//get the all item card info
		const items = $('.item');
		let info = '';
		items.each(function (index, item) {
			info += `${$(item).find('h5').text()},卸${$(item).find('span[data-to_addr]').text()}, ${$(item).find('span[data-v_qty]').text()}车, ${$(item).find('span[data-id]').text().substring(8,18)} \n`;
		});

		//display the info in a dialog
		frappe.msgprint(info);
	});

}