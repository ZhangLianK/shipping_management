var default_transporter = frappe.user_defaults.default_transporter;
frappe.pages['ship-plan-list'].on_page_load = function (wrapper) {

	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: '配车计划',
		sidebartoggle: true,

	});
	// Add CSS to the page
	var css = `
	 #ship-plan-container {
		 display: flex;
		 flex-direction: column;
	 }
	 .ship-plan-card {
		 border: 1px solid #d1d8dd;
		 border-radius: 4px;
		 padding: 15px;
		 margin-bottom: 10px;
		 background: #ffffff;
	 }
	 .ship-plan-header {
		 display: flex;
		 justify-content: space-between;
		 align-items: center;
	 }
	 .ship-plan-title {
		 margin: 0;
		 font-size: 1.2em;
	 }
	 .status-label {
		 margin-left: auto;
		 background: #f0f0f0;
		 padding: 2px 5px;
		 border-radius: 4px;
		 font-size: 0.9em;
	 }
	 .ship-plan-body p {
		 margin: 0;
		 color: #555;
	 }

	 #bottom-buttons {
        position: fixed; /* Fix position at the bottom */
        bottom: 0;
        left: 0;
        width: 100%;
        background: #fff; /* Match your theme */
        border-top: 1px solid #d1d8dd;
        padding: 10px;
        box-shadow: 0 -2px 5px rgba(0,0,0,0.1); /* Optional: adds shadow for elevation effect */
        z-index: 100; /* Ensure it's above other content */
    }
	.back-btn {
		width: 100%
		text-align: center;
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

	// Create a container for ship plans
	page.main.html('<div id="ship-plan-container"></div>');

	//create a container for bottom buttons
	page.main.append('<div id="bottom-buttons"></div>');

	// Initial call to populate the page
	refresh_vehicle_plans();

	// Optionally, you can add a button to refresh the ship plan list
	page.set_primary_action(__('Refresh'), function () {
		refresh_vehicle_plans();
	}, 'refresh');
};
frappe.pages['ship-plan-list'].on_page_show = function (wrapper) {
	//const route = frappe.get_route();
	refresh_vehicle_plans();
	$(wrapper).find('#bottom-buttons').html(`<button style="width:100%" class="btn btn-default back-btn" onclick="frappe.set_route('dispatch');">返回</button>`);
};

// Function to fetch and render ship plans
function refresh_vehicle_plans() {
	frappe.db.get_list('Vehicle Plan Item', {
		fields: ['date', 'req_qty', 'status', 'req_qty', 'assigned_qty', 'plan_desc', 'from_addr', 'name','ship_plan'],
		filters: {
			'status': ['!=', '完成'],
		},
		order_by: 'date desc',
		limit: 'all'
	}).then(records => {
			if (records.length > 0) {
				// Clear the container before adding new content
				var container = $('#ship-plan-container');
				container.empty();

				// Iterate over ship plans and create cards
				$.each(records, function (index, vehicle_plan) {
					var card_html = `<div class="ship-plan-card">
						<div class="ship-plan-header">
							<h4 class="ship-plan-desc">${vehicle_plan.plan_desc}</h4>
							<span class="status-label">${vehicle_plan.status}</span>
						</div>
						<div class="ship-plan-body">

							<p>需求量: ${vehicle_plan.req_qty}
							<span style="float:right;">计划日期: ${vehicle_plan.date}</span> 
							</p>

							<p> 
							已配运量: ${vehicle_plan.assigned_qty}
							<span style="float:right;">提货地: ${vehicle_plan.from_addr}</span> 
							</p>
							<p>
							<span>${vehicle_plan.ship_plan}</span>:<span>${vehicle_plan.name}</span>
							</p>

						</div>
					</div>`;
					
					// Convert the HTML string to a jQuery object and add click event
					var $card_html = $(card_html).click(function() {
						frappe.set_route('ship-plan-vehicle',{ship_plan: vehicle_plan.ship_plan, transporter: default_transporter,vehicle_plan: vehicle_plan.name});
					});
					container.append($card_html)
				});
			}
		});
}