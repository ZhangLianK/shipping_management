frappe.pages['ship-plan-vehicle'].on_page_load = function (wrapper) {
	let page = frappe.ui.make_app_page({
		parent: wrapper,
		title: '配车详单',
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
		z-index: 1000;
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

	if (!ship_plan_name){
		//clear all containers
		$('.ship-plan-info').empty();
		$('.scale-items-container').empty();
		$('.vehicles-container').empty();
	}
	page.set_primary_action(__('Refresh'), function () {
		fetchAndDisplayScaleItems();
	}, 'refresh');
};

frappe.pages['ship-plan-vehicle'].on_page_show = function (wrapper) {
	//const route = frappe.get_route();
	const ship_plan_name = frappe.route_options.ship_plan;
	const transporter = frappe.route_options.transporter;
	const vehicle_plan = frappe.route_options.vehicle_plan;
	// Fetch and display scale items whenever the page is shown
	if (vehicle_plan) {
		display_ship_plan_info();
		fetchAndDisplayScaleItems();
		init_buttons_dispatch();
	}
};


function fetchAndDisplayScaleItems() {
	//const route = frappe.get_route();
	const ship_plan_name = frappe.route_options.ship_plan;
	const vehicle_plan = frappe.route_options.vehicle_plan;
	let transporter = frappe.route_options.transporter;
	if (transporter==''){
		transporter = undefined;
	}
	//clear ship plan info and regenerate it
	
	// Assuming `fetchScaleItems` is your method to get scale items from the server
	frappe.db.get_list('Scale Item', {
			filters: {
				ship_plan: ship_plan_name,
				vehicle_plan: vehicle_plan,
				transporter: transporter,
				status: ['!=', '9 已取消']
			},
			fields: ['vehicle', 'target_weight', 'status', 'name','to_addr','from_dt','to_dt'],
			order_by: 'creation',
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
	const vehicle_plan = frappe.route_options.vehicle_plan;
	$('.ship-plan-info').empty();
	//fetch the vehicle plan and display it
	frappe.db.get_doc('Vehicle Plan Item', vehicle_plan).then(doc => {
			if (doc) {
				$('.ship-plan-info').append(`
				<h3>
				<span>${doc.date}</span>
				<span style="float:right">${doc.plan_desc}</span>
				</h3>
				<p><span id="transporter-name">承运商：${transporterName?transporterName:'所有'}</span>
				<span id="vehicle-plan" style="float:right">配车计划：${doc.name}</span>
				</p>
				<p><span>需求量: ${doc.req_qty} 吨</span>
				<span style="float:right">已配车量:${doc.assigned_qty} 吨</span></p>
				<span id="baohao_template" style = "display:none">${doc.baohao_template?doc.baohao_template:''}</span>
				`);
			}
	});
}

function display_scale_items(scale_items) {
	scale_items.forEach((item, index) => {
		// First, convert the HTML string into a jQuery object
		const $itemHtml = $(`
		    <div class="scale-item" data-item-name="${item.name}">
		        <div class="item-header">
					<div>
		            	<h5>${index + 1}. ${item.vehicle} 
							<span class="status-label" style="float: right;">
								${(item.from_dt&&item.to_dt)?'已结束':item.from_dt?'进行中': '未接单' }
							</span>
						</h5>
					</div>
		        </div>
		        <div class="item-body" style="display: flex; justify-content: space-between;">
		            <div>
		                <p>预装量: ${item.target_weight}</p>
		                <p>车辆状态:${item.status}</p>
		            </div>
		            <div style="text-align: right;">
		                <p>单号: ${item.name}</p>
						<p>卸车地: ${item.to_addr?item.to_addr:''}</p>
		            </div>
		        </div>
		    </div>
		`);

		// Now, attach the click event handler to the jQuery object
		$itemHtml.click(function () {
			$(this).toggleClass('selected'); // Toggle the 'selected' class on click
			//check how many items are selected
			const selectedItems = $('.scale-item.selected').length;
			if (selectedItems > 1) {
				$('.edit-btn').hide();
			} else if(selectedItems == 1) {
				//get selected item
				$('.edit-btn').show();
			}else{
				//hide all edit buttons
				$('.edit-btn').hide();
			}
		});
		$('edit-btn').click(function () {
			console.log('Edit button clicked');
		});
		// Finally, append the jQuery object to your container
		$('.scale-items-container').append($itemHtml);
	});

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
	let transporter = frappe.user_defaults.default_transporter;
	if (!transporter) {
		transporter = undefined;
	}
	frappe.db.get_list('Vehicle', {
			filters: {
				transporter: transporter
			},
			fields: ['name', 'standard_qty','id','wheels'],
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
            <div class="vehicle-card" data-vehicle-id="${vehicle.name}" style="${vehicle.wheels==0?'color: green;':'color: black;'}">
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

		vehicleCard.on('click', '.input-qty', function(event) {
			event.stopPropagation();
			// You can also place focus logic here if needed
		});

	});

	// Modify the assign button for saving selected vehicles with their quantities
	// Update your saveSelectedVehiclesToShipPlan function as needed to include quantities
}

function saveSelectedVehiclesToShipPlan(selectedVehicles) {
	//get shipPlanName from the ship-plan-info
	const vehicle_plan = frappe.route_options.vehicle_plan;
	const shipPlanName = frappe.route_options.ship_plan;
	if(vehicle_plan){
		frappe.call({
			method: 'shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.save_scale_item_m', // Adjust with your actual method path
			args: {
				ship_plan_name: shipPlanName,
				vehicle_plan: vehicle_plan, // Ensure you have this variable available
				vehicles: selectedVehicles
			},
			callback: function (r) {
				if (r.message == 'success') {
					// Handle success (e.g., show a success message, refresh the page)
					console.log("Success", r.message);
					$('.save-btn').hide();
					//hide the vehicles container and show the scale items container
					$('.vehicles-container').hide();
					display_ship_plan_info();
					fetchAndDisplayScaleItems();
				}
			}
		});
	}
}

function init_buttons_dispatch() {
	const buttons_wrapper = $('.footer-buttons');
	//remove all buttons
	buttons_wrapper.empty();

	// Buttons fixed at the bottom
	$('#page-ship-plan-vehicle').find('.footer-buttons').append(`
        <div class="footer-buttons">
			<button class="btn back-btn">返回</button>
            <button class="btn btn-primary save-btn" style="display: none;">保存</button>
			<button class="btn cancel-btn">取消</button>
			<button class="btn edit-btn" style="display: none;">更改</button>
            <button class="btn assign-btn">配车</button>
			<button class="btn baohao-btn">报号</button>
        </div>
    `);
	$('.baohao-btn').click(function () {
		//get all scale items'name listed in the page
		const scaleItems = $('.scale-item').map(function () {
			return $(this).data('item-name');
		}
		).get();
		//get the baohao_template
		const baohao_template = $('#baohao_template').text();
		if (!baohao_template){
			frappe.msgprint(__('物流计划未设置报号模板，请联系物流计划部门设置报号模板'));
			return;
		}
		if (scaleItems.length > 0) {
			// Call the server-side method to cancel these scale items
			frappe.call({
				method: 'shipping_management.shipping_management.doctype.scale_item.scale_item.update_baohao_text', // Adjust this to your server-side method's actual path
				args: {
					baohao_template: baohao_template,
					scale_items: scaleItems
				},
				callback: function(r) {
					if (r.message) {
						if (r.message.status === 'success') {
							// Optionally, remove the cancelled items from the UI
							//generate a dialog with close button to the text
							frappe.msgprint(r.message.baohao_text);

						}
					} else {
						// Handle error
						frappe.msgprint(__(r.message.message));
					}
				}
			});
		}


	});

	$('.edit-btn').click(function () {
		//get the selected scale item
		const selectedScaleItem = $('.scale-item.selected').data('item-name');
		console.log('Edit button clicked', selectedScaleItem);
		//get the selected scale item and open the edit form
		frappe.route_options['tab'] = "scale-item-关联信息_tab";
		frappe.set_route(['Form', 'Scale Item', selectedScaleItem]);
	});

	$('.back-btn').click(function () {
		frappe.set_route('ship-plan-list');

	});

	$('.assign-btn').click(function () {
		$('.assign-btn').hide()
		$('.baohao-btn').hide();
		$('.scale-items-container').hide(); // Hide scale items container
		$('.save-btn').show()
		$('.cancel-btn').hide();
		fetchAndDisplayVehicles(); // Fetch and display vehicles
		//reset back-btn so that it can go back to the scale items,clear all other click events
		$('.back-btn').off('click');
		$('.back-btn').click(function () {
			$('.baohao-btn').show();
			$('.assign-btn').show();
			$('.cancel-btn').show();
			$('.vehicles-container').hide();
			$('.scale-items-container').show();
			//reset back-btn so that it can go back to the ship-plan-list,clear all other click events
			$('.back-btn').off('click');
			//hide save button
			$('.save-btn').hide();
			$('.back-btn').click(function () {
				frappe.set_route('ship-plan-list');
			});

		});

	});
	$('.save-btn').click(function () {
		$('.assign-btn').show();
		$('.cancel-btn').show();
		$('baoahao-btn').show();
		const selectedVehicles = $('.vehicle-card.selected').map(function () {
			const vehicleId = $(this).data('vehicle-id');
			const qty = parseFloat($(this).find('.input-qty').val());
			return {
				vehicle_id: vehicleId,
				quantity: qty
			};
		}).get(); 

		saveSelectedVehiclesToShipPlan(selectedVehicles);
		$('.back-btn').off('click');
		$('.back-btn').click(function () {
			frappe.set_route('ship-plan-list');
		});
		$('.back-btn').show();
	});
	$('.cancel-btn').click(function() {
		//count 5 seconds before enable the button again, during the counting the button text display count down numbers
		$('.cancel-btn').prop('disabled', true);
		$('.cancel-btn').text('5');
		var count = 5;
		var counter = setInterval(timer, 1000);
		function timer() {
			count = count - 1;
			if (count <= 0) {
				clearInterval(counter);
				$('.cancel-btn').prop('disabled', false);
				$('.cancel-btn').text('取消');
			}
			else {
				$('.cancel-btn').text(count);
			}
		}
		// Collect the names of all selected scale items
		const selectedScaleItemNames = $('.scale-item.selected').map(function() {
			return $(this).data('item-name'); // Assuming each .scale-item has a data attribute like data-item-name with the item's name
		}).get();
	
		if (selectedScaleItemNames.length > 0) {
			// Call the server-side method to cancel these scale items
			frappe.call({
				method: 'shipping_management.shipping_management.doctype.shipping_management_tool.shipping_management_tool.cancel_scale_items', // Adjust this to your server-side method's actual path
				args: {
					scale_items: selectedScaleItemNames
				},
				callback: function(r) {``
					if (r.message) {
						for (let result of r.message) {
							// Handle each result as needed
							if (result.status === 'success') {
								// Optionally, remove the cancelled items from the UI
								frappe.msgprint(__('已取消：'+result.scale_item + ' - ' + result.vehicle));
							}
							else{
								frappe.msgprint(__('取消失败：'+result.scale_item + ' - ' + result.vehicle));
							}
							
						}
					} else {
						// Handle error
						frappe.msgprint(__('There was an issue cancelling the selected scale items.'));
					}
					fetchAndDisplayScaleItems();
					display_ship_plan_info();
				}
			});
		} else {
			frappe.msgprint(__('请选择要取消的物流单！'));
		}
	});
}