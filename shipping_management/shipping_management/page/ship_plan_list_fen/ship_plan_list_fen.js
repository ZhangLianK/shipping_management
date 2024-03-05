frappe.pages['ship-plan-list-fen'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: '物流计划-分量',
		single_column: true
	});



	var default_transporter = frappe.user_defaults.default_transporter;

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

	// Function to fetch and render ship plans
	function refresh_ship_plans() {
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'Ship Plan',
				filters: {
					'status': ['!=', '完成'],
				},
				fields: ['name', 'date', 'qty', 'status','assigned_qty','plan_desc'],
				limit: 'all',
				order_by: 'creation desc',
			},

			callback: function (r) {
				if (r.message) {
					// Clear the container before adding new content
					var container = $('#ship-plan-container');
					container.empty();

					// Iterate over ship plans and create cards
					$.each(r.message, function (index, ship_plan) {
						var card_html = `<div class="ship-plan-card">
								<div class="ship-plan-header">
								<h4 class="ship-plan-desc">${ship_plan.plan_desc}</h4>
								<span class="status-label">${ship_plan.status}</span>
							</div>
							<div class="ship-plan-body">
								<p>计划量: ${ship_plan.qty} 
								<span style='float:right'>${ship_plan.name}</span>
								</p>
								<p> 计划日期: ${ship_plan.date}
								<span style='float:right'>已配运量: ${ship_plan.assigned_qty}</span>
								</p>
					</div>
						</div>`;
						
                        // Convert the HTML string to a jQuery object and add click event
                        var $card_html = $(card_html).click(function() {
							frappe.set_route('ship-plan-vehicle-fe',{ship_plan: ship_plan.name, transporter: default_transporter});
                        });
						container.append($card_html)
						
					});

				}
			}
		});
	}

	// Initial call to populate the page
	refresh_ship_plans();

	// Optionally, you can add a button to refresh the ship plan list
	page.set_primary_action(__('Refresh'), function () {
		refresh_ship_plans();
	}, 'refresh');
};
