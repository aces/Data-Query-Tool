Array.prototype.intersect = function(arrays) {
    var i, j;
    var intersection = [];
    var missing = false;
    var el;
    for(el in this) {
        if(this.hasOwnProperty(el)) {
            val = this[el];
            missing = false;
            for(var j = 0; j < arrays.length; j++) {
                array = arrays[j];
                if(array.contains(val) === false) {
                    missing = true;
                    break;
                }
            }
            if(!missing) {
                intersection.push(val);
            }
        }
    }
    return intersection;
}

Array.prototype.equals = function(other) {
    if(!(other instanceof Array)) {
        return false;
    }
    if(this.length != other.length) {
        return false;
    }
    for(var i = 0; i < this.length; i++) {
        if(this[i] != other[i]) {
            return false;
        }
    }
    
    return true;
}

Array.prototype.contains = function(value)  {
    for(var i = 0; i < this.length; i++) {
        if( (this[i] && this[i].equals && this[i].equals(value))
                || (this[i] === value) ) {
            return true;
        }
    }
    return false;
}

Array.prototype.unique = function () {
    var r = new Array();
    o:for(var i = 0, n = this.length; i < n; i++)
    {
        for(var x = 0, y = r.length; x < y; x++)
        {
            if(r[x]==this[i])
            {
                continue o;
            }
        }
        r[r.length] = this[i];
    }
    return r;
}

