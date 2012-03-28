Array.prototype.intersect = function (arrays) {
    "use strict";
    var i, intersection = [], missing = false, val, el, array;
    for (el in this) {
        if (this.hasOwnProperty(el)) {
            val = this[el];
            missing = false;
            for (i = 0; i < arrays.length; i += 1) {
                array = arrays[i];
                if (array.contains(val) === false) {
                    missing = true;
                    break;
                }
            }
            if (!missing) {
                intersection.push(val);
            }
        }
    }
    return intersection;
};

Array.prototype.equals = function (other) {
    "use strict";
    var i;
    if (!(other instanceof Array)) {
        return false;
    }
    if (this.length !== other.length) {
        return false;
    }
    for (i = 0; i < this.length; i += 1) {
        if (this[i] !== other[i]) {
            return false;
        }
    }
    
    return true;
};

Array.prototype.xlastIndexOf = function(value) {
    "use strict";
    for(var i = 0; i < this.length; i++) {
        if( (this[i] && this[i].equals && this[i].equals(value))
                || (this[i] === value) ) {
            return i;
        }
    }
    return -1;

}

Array.prototype.contains = function(value)  {
    "use strict";
    for(var i = 0; i < this.length; i++) {
        if( (this[i] && this[i].equals && this[i].equals(value))
                || (this[i] === value) ) {
            return true;
        }
    }
    return false;
}

Array.prototype.containsPrefix = function(prefix) {
    var match = false;
    for(var i = 0; i < this.length; i++) {
        match = true;
        if(this[i] instanceof Array) {
            for(var j = 0; j < prefix.length; j++) {
                if(this[i][j] !== prefix[j]) {
                    match = false;
                    break;
                }
            }
            if(match) {
                return true;
            }
        }
    }
    return false;
}

Array.prototype.clone = function() {
    "use strict";
    var a = [];
    for(var i = 0; i < this.length; i++) {
        a[i] = this[i];
    }
    return a;
}
Array.prototype.unique = function () {
    "use strict";
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
