$(document).ready(function() {
    $('.help-button').click(function() {
		url = "help/" + this.id + ".html";
		window.open(url, this.id, 'height=400,width=800,left=10,top=10,titlebar=no,toolbar=no,menubar=no,location=no,directories=no,status=no'); 
	});

	$('.help-button').button({
       icons: {primary: 'ui-icon-help'}
   });
});