"use strict";
Array.prototype.intersect = function (arrays) {
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

Array.prototype.xlastIndexOf = function (value) {
    var i;
    for (i = 0; i < this.length; i += 1) {
        if ((this[i] && this[i].equals && this[i].equals(value))
                || (this[i] === value)) {
            return i;
        }
    }
    return -1;
};

Array.prototype.contains = function (value) {
    var i;
    for (i = 0; i < this.length; i += 1) {
        if ((this[i] && this[i].equals && this[i].equals(value))
                || (this[i] === value)) {
            return true;
        }
    }
    return false;
};

Array.prototype.containsPrefix = function (prefix) {
    var match = false, i, j;
    for (i = 0; i < this.length; i += 1) {
        match = true;
        if (this[i] instanceof Array) {
            for (j = 0; j < prefix.length; j += 1) {
                if (this[i][j] !== prefix[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return true;
            }
        }
    }
    return false;
};

Array.prototype.clone = function () {
    var a = [], i;
    for (i = 0; i < this.length; i += 1) {
        a[i] = this[i];
    }
    return a;
};

Array.prototype.unique = function () {
    var r = [], i, j, alreadyAdded;
    for (i = 0; i < this.length; i += 1) {
        alreadyAdded = false;
        for (j = 0; j < r.length; j += 1) {
            if (r[j] === this[i]) {
                alreadyAdded = true;
                break;
            }
        }
        if (alreadyAdded !== true) {
            r[j] = this[i];
        }
    }
    return r;
};
