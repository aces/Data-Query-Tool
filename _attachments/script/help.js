$(document).ready(function() {
	// Make the help page open in a pop-up.
    $('.help-button').click(function() {
    	// Grab the ID of the currently visible panel
    	var activePanel = $('#tabs .ui-tabs-panel[aria-hidden="false"]').prop('id');
		var url = "help/" + activePanel + ".html";
		window.open(url, "Help", 'height=400,width=800,left=10,top=10,titlebar=no,toolbar=no,menubar=no,location=no,directories=no,status=no'); 
	});

    // Add question mark icon to the help button
	$('.help-button').button({
       icons: {primary: 'ui-icon-help'}
   });
});