function(keys, values, rereduce) {
    if(rereduce === false) { 
        return values.length; 
    } else {
        return sum(values);
    }
}