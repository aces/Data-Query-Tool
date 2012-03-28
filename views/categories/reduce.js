function (keys, values, rereduce) {
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

    var tmp = [];
    if(rereduce == false) {
        for(i = 0; i < keys.length; i++) {
            val = keys[i][0][0];
            if(val != null && tmp.indexOf(val) == -1) {
                tmp.push(val);
            }
        }
    } else {
        for(i = 0; i < values.length; i++) {
            val = values[i];
            if(val != null && tmp.indexOf(val) == -1) {
                tmp = tmp.concat(val);
            }
            tmp = tmp.unique();
        }
    }
    return tmp.unique();
}
