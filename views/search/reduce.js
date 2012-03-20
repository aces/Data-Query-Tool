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

   var tmp = [], 
       MAX_CHOICES = 5,
       val = undefined;
   if(rereduce == false) {
      for(i = 0; i < keys.length; i++) {
          val = keys[i][0][2];
          if(val !== null) {
              if(val.length > 50) {
                 val = val.substring(0, 47);
              } 
              if(tmp.indexOf(val) === -1) {
                 tmp.push(val);
              }
          }
      }
   } else {
      for(i = 0; i < values.length; i++) {
           val = values[i];
           if(val === 'many') {
              return 'many'; 
           } else if(val === 'string') {
              return 'string';
           }
           if(val !== null && tmp.indexOf(val) === -1) {
              tmp = tmp.concat(val);
           }
      }
   }

   tmp = tmp.unique();
   if(tmp.length > MAX_CHOICES) { return 'many'; }
   return tmp;
}
