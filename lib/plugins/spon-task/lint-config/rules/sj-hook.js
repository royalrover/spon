/**
 * @fileoverview  rules for showjoy F2E Team jquery find html dom elements
 * @author miqi@showjoy.com
 * Copyright © 尚妆 2014-2016, All Rights Reserved.浙ICP备12027495号
 */

 "use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {
    //--------------------------------------------------------------------------
    // Helpers
    //--------------------------------------------------------------------------

    return {

        "Literal": function(node) {
            var resultArr = [];
            var classReg = /[\.\#][jJ]_(\S*)/g;
            var camelcaseReg = /^[A-Z]([A-Za-z0-9]*)/;
            var classResult;
            var resultArr;
            var length;

            classResult = classReg.exec( node.value );
            if( classResult != null ){
                classResult[0] = classResult[0].substring(0, 2);
                classResult[1] = classResult[1].substring(0, classResult[1].indexOf('\s') > -1 ? classResult[1].indexOf('\s') : classResult[1].length);
                resultArr.push([classResult[0], classResult[1]]);
            } else {
                return false;
            }
            length = resultArr.length;
            while(length > 0){
                length--;
                if(resultArr[length][0] == ".j" || resultArr[length][0] == "#J"){
                    if(resultArr[length][1].indexOf('[') > -1){
                        return false;
                    }
                    if( !camelcaseReg.test(resultArr[length][1]) || resultArr[length][1].indexOf('_') > -1 || resultArr[length][1].indexOf('-') > -1){
                       context.report({
                            node: node,
                            message: "sj-hook has accrued a problem in "+ resultArr[length][0] +'_'+ resultArr[length][1]
                        }); 
                    }
                } else {
                    context.report({
                        node: node,
                        message: "sj-hook has accrued a problem in "+ resultArr[length][0] +'_'+ resultArr[length][1]
                    });
                }
            }
        }
    };

};

module.exports.schema = [
    {
        "type": "object",
        "properties": {
            "allow": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "minItems": 1,
                "uniqueItems": true
            }
        },
        "additionalProperties": false
    }
];

