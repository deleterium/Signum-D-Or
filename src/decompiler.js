


function decompiler(machinecode, JSONmap) {

    const ciyam_spec = {
        op_code_table: [
            { op_code: 0x01, name: "SET", size: 13, args_type: "IL",  template:   "%1 @%2 #%3"  },          // SET @var #0000000000000001
            { op_code: 0x02, name: "SET", size:  9, args_type: "II",  template:   "%1 @%2 $%3"  },                   // SET @var $var
            { op_code: 0x03, name: "CLR", size:  5, args_type: "I",   template:   "%1 @%2" },
            { op_code: 0x04, name: "INC", size:  5, args_type: "I",   template:   "%1 @%2" },
            { op_code: 0x05, name: "DEC", size:  5, args_type: "I",   template:   "%1 @%2" },
            { op_code: 0x06, name: "ADD", size:  9, args_type: "II",  template:   "%1 @%2 $%3" },
            { op_code: 0x07, name: "SUB", size:  9, args_type: "II",  template:   "%1 @%2 $%3" },
            { op_code: 0x08, name: "MUL", size:  9, args_type: "II",  template:   "%1 @%2 $%3" },
            { op_code: 0x09, name: "DIV", size:  9, args_type: "II",  template:   "%1 @%2 $%3" },
            { op_code: 0x0a, name: "BOR", size:  9, args_type: "II",  template:   "%1 @%2 $%3" },
            { op_code: 0x0b, name: "AND", size:  9, args_type: "II",  template:   "%1 @%2 $%3" },
            { op_code: 0x0c, name: "XOR", size:  9, args_type: "II",  template:   "%1 @%2 $%3" },
            { op_code: 0x0d, name: "NOT", size:  5, args_type: "I",   template:   "%1 @%2" },
            { op_code: 0x0e, name: "SET", size:  9, args_type: "II",  template:   "%1 @%2 $($%3)" },
            { op_code: 0x0f, name: "SET", size: 13, args_type: "III", template:   "%1 @%2 $($%3 + $%4)" },
            { op_code: 0x10, name: "PSH", size:  5, args_type: "I",   template:   "%1 $%2" },
            { op_code: 0x11, name: "POP", size:  5, args_type: "I",   template:   "%1 @%2" },
            { op_code: 0x12, name: "JSR", size:  5, args_type: "J",   template:   "%1 :%2" },                             // JSR :function
            { op_code: 0x13, name: "RET", size:  1, args_type: "",    template:   "%1" },
            { op_code: 0x14, name: "SET", size:  9, args_type: "II",  template:   "%1 @($%2) $%3" },
            { op_code: 0x15, name: "SET", size: 13, args_type: "III", template:   "%1 @($%2 + $%3) $%4" },
            { op_code: 0x16, name: "MOD", size:  9, args_type: "II",  template:   "%1 @%2 $%3" },
            { op_code: 0x17, name: "SHL", size:  9, args_type: "II",  template:   "%1 @%2 $%3" },
            { op_code: 0x18, name: "SHR", size:  9, args_type: "II",  template:   "%1 @%2 $%3" },
            { op_code: 0x19, name: 'POW', size:  9, args_type: "II",  template:   "%1 @%2 $%3"  },                   // atv3 POW @var $var
            { op_code: 0x1a, name: "JMP", size:  5, args_type: "J",   template:   "%1 :%2" },                             // JMP :label
            { op_code: 0x1b, name: "BZR", size:  6, args_type: "IB",  template:   "%1 $%2 :%3" },                   // BZR $var :label
            { op_code: 0x1e, name: "BNZ", size:  6, args_type: "IB",  template:   "%1 $%2 :%3" },                   // BZR $var :label
            { op_code: 0x1f, name: "BGT", size: 10, args_type: "IIB", template:   "%1 $%2 $%3 :%4" },         // BGT $var $var :label
            { op_code: 0x20, name: "BLT", size: 10, args_type: "IIB", template:   "%1 $%2 $%3 :%4" },         // BLT $var $var :label
            { op_code: 0x21, name: "BGE", size: 10, args_type: "IIB", template:   "%1 $%2 $%3 :%4" },         // BGE $var $var :label
            { op_code: 0x22, name: "BLE", size: 10, args_type: "IIB", template:   "%1 $%2 $%3 :%4" },         // BLE $var $var :label
            { op_code: 0x23, name: "BEQ", size: 10, args_type: "IIB", template:   "%1 $%2 $%3 :%4" },         // BEQ $var $var :label
            { op_code: 0x24, name: "BNE", size: 10, args_type: "IIB", template:   "%1 $%2 $%3 :%4" },         // BNE $var $var :label
            { op_code: 0x25, name: "SLP", size:  5, args_type: "I",   template:   "%1 $%2" },
            { op_code: 0x26, name: "FIZ", size:  5, args_type: "I",   template:   "%1 $%2" },
            { op_code: 0x27, name: "STZ", size:  5, args_type: "I",   template:   "%1 $%2" },
            { op_code: 0x28, name: "FIN", size:  1, args_type: "",    template:   "%1" },
            { op_code: 0x29, name: "STP", size:  1, args_type: "",    template:   "%1" },
            { op_code: 0x2a, name: 'SLP', size:  1, args_type: "",    template:   "%1" },
            { op_code: 0x2b, name: "ERR", size:  5, args_type: "J",   template:   "%1 :%2" },                             // ERR :label
            { op_code: 0x2c, name: 'MDV', size: 13, args_type: "III", template:   "%1 @%2 $%3 $%4" },
            { op_code: 0x30, name: "PCS", size:  1, args_type: "",    template:   "%1" },
            { op_code: 0x32, name: "FUN", size:  3, args_type: "F",   template:   "%1 %2" },
            { op_code: 0x33, name: "FUN", size:  7, args_type: "FI",  template:   "%1 %2 $%3" },
            { op_code: 0x34, name: "FUN", size: 11, args_type: "FII", template:   "%1 %2 $%3 $%4" },
            { op_code: 0x35, name: "FUN", size:  7, args_type: "FI",  template:   "%1 @%3 %2" },
            { op_code: 0x36, name: "FUN", size: 11, args_type: "FII", template:   "%1 @%3 %2 $%4" },
            { op_code: 0x37, name: "FUN", size: 15, args_type: "FIII",template:   "%1 @%3 %2 $%4 $%5" },
            { op_code: 0x7f, name: "NOP", size:  1, args_type: "",    template:   "%1" },
        ],

        api_code_table: [
            { name: "get_A1",           api_code: 0x0100, op_code: 0x35 },
            { name: "get_A2",           api_code: 0x0101, op_code: 0x35 },
            { name: "get_A3",           api_code: 0x0102, op_code: 0x35 },
            { name: "get_A4",           api_code: 0x0103, op_code: 0x35 },
            { name: "get_B1",           api_code: 0x0104, op_code: 0x35 },
            { name: "get_B2",           api_code: 0x0105, op_code: 0x35 },
            { name: "get_B3",           api_code: 0x0106, op_code: 0x35 },
            { name: "get_B4",           api_code: 0x0107, op_code: 0x35 },
            { name: "set_A1",           api_code: 0x0110, op_code: 0x33 },
            { name: "set_A2",           api_code: 0x0111, op_code: 0x33 },
            { name: "set_A3",           api_code: 0x0112, op_code: 0x33 },
            { name: "set_A4",           api_code: 0x0113, op_code: 0x33 },
            { name: "set_A1_A2",        api_code: 0x0114, op_code: 0x34 },
            { name: "set_A3_A4",        api_code: 0x0115, op_code: 0x34 },
            { name: "set_B1",           api_code: 0x0116, op_code: 0x33 },
            { name: "set_B2",           api_code: 0x0117, op_code: 0x33 },
            { name: "set_B3",           api_code: 0x0118, op_code: 0x33 },
            { name: "set_B4",           api_code: 0x0119, op_code: 0x33 },
            { name: "set_B1_B2",        api_code: 0x011a, op_code: 0x34 },
            { name: "set_B3_B4",        api_code: 0x011b, op_code: 0x34 },
            { name: "clear_A",          api_code: 0x0120, op_code: 0x32 },
            { name: "clear_B",          api_code: 0x0121, op_code: 0x32 },
            { name: "clear_A_B",        api_code: 0x0122, op_code: 0x32 },
            { name: "copy_A_From_B",    api_code: 0x0123, op_code: 0x32 },
            { name: "copy_B_From_A",    api_code: 0x0124, op_code: 0x32 },
            { name: "check_A_Is_Zero",  api_code: 0x0125, op_code: 0x35 },
            { name: "check_B_Is_Zero",  api_code: 0x0126, op_code: 0x35 },
            { name: "check_A_equals_B", api_code: 0x0127, op_code: 0x35 },
            { name: "swap_A_and_B",     api_code: 0x0128, op_code: 0x32 },
            { name: "OR_A_with_B",      api_code: 0x0129, op_code: 0x32 },
            { name: "OR_B_with_A",      api_code: 0x012a, op_code: 0x32 },
            { name: "AND_A_with_B",     api_code: 0x012b, op_code: 0x32 },
            { name: "AND_B_with_A",     api_code: 0x012c, op_code: 0x32 },
            { name: "XOR_A_with_B",     api_code: 0x012d, op_code: 0x32 },
            { name: "XOR_B_with_A",     api_code: 0x012e, op_code: 0x32 },
            { name: "add_A_to_B",       api_code: 0x0140, op_code: 0x32 },
            { name: "add_B_to_A",       api_code: 0x0141, op_code: 0x32 },
            { name: "sub_A_from_B",     api_code: 0x0142, op_code: 0x32 },
            { name: "sub_B_from_A",     api_code: 0x0143, op_code: 0x32 },
            { name: "mul_A_by_B",       api_code: 0x0144, op_code: 0x32 },
            { name: "mul_B_by_A",       api_code: 0x0145, op_code: 0x32 },
            { name: "div_A_by_B",       api_code: 0x0146, op_code: 0x32 },
            { name: "div_B_by_A",       api_code: 0x0147, op_code: 0x32 },
            { name: "MD5_A_to_B",             api_code: 0x0200, op_code: 0x32 },
            { name: "check_MD5_A_with_B",     api_code: 0x0201, op_code: 0x35 },
            { name: "HASH160_A_to_B",         api_code: 0x0202, op_code: 0x32 },
            { name: "check_HASH160_A_with_B", api_code: 0x0203, op_code: 0x35 },
            { name: "SHA256_A_to_B",          api_code: 0x0204, op_code: 0x32 },
            { name: "check_SHA256_A_with_B",  api_code: 0x0205, op_code: 0x35 },
            { name: 'Check_Sig_B_With_A',     api_code: 0x0206, op_code: 0x35 },
            { name: "get_Block_Timestamp",       api_code: 0x0300, op_code: 0x35 },
            { name: "get_Creation_Timestamp",    api_code: 0x0301, op_code: 0x35 },
            { name: "get_Last_Block_Timestamp",  api_code: 0x0302, op_code: 0x35 },
            { name: "put_Last_Block_Hash_In_A",  api_code: 0x0303, op_code: 0x32 },
            { name: "A_to_Tx_after_Timestamp",   api_code: 0x0304, op_code: 0x33 },
            { name: "get_Type_for_Tx_in_A",      api_code: 0x0305, op_code: 0x35 },
            { name: "get_Amount_for_Tx_in_A",    api_code: 0x0306, op_code: 0x35 },
            { name: "get_Timestamp_for_Tx_in_A", api_code: 0x0307, op_code: 0x35 },
            { name: "get_Ticket_Id_for_Tx_in_A", api_code: 0x0308, op_code: 0x35 },
            { name: "message_from_Tx_in_A_to_B", api_code: 0x0309, op_code: 0x32 },
            { name: "B_to_Address_of_Tx_in_A",   api_code: 0x030a, op_code: 0x32 },
            { name: "B_to_Address_of_Creator",   api_code: 0x030b, op_code: 0x32 },
            { name: 'Get_Code_Hash_Id',          api_code: 0x030c, op_code: 0x35 },
            { name: 'B_To_Assets_Of_Tx_In_A',    api_code: 0x030d, op_code: 0x35 },
            { name: "get_Current_Balance",         api_code: 0x0400, op_code: 0x35 },
            { name: "get_Previous_Balance",        api_code: 0x0401, op_code: 0x35 },
            { name: "send_to_Address_in_B",        api_code: 0x0402, op_code: 0x33 },
            { name: "send_All_to_Address_in_B",    api_code: 0x0403, op_code: 0x32 },
            { name: "send_Old_to_Address_in_B",    api_code: 0x0404, op_code: 0x32 },
            { name: "send_A_to_Address_in_B",      api_code: 0x0405, op_code: 0x32 },
            { name: "add_Minutes_to_Timestamp",    api_code: 0x0406, op_code: 0x37 },
            { name: 'Get_Map_Value_Keys_In_A',     api_code: 0x0407, op_code: 0x35 },
            { name: 'Set_Map_Value_Keys_In_A',     api_code: 0x0408, op_code: 0x32 },
            { name: 'Issue_Asset',                 api_code: 0x0409, op_code: 0x35 },
            { name: 'Mint_Asset',                  api_code: 0x040a, op_code: 0x32 },
            { name: 'Distribute_To_Asset_Holders', api_code: 0x040b, op_code: 0x32 },
            { name: 'Get_Asset_Holders_Count',     api_code: 0x040c, op_code: 0x35 },
            { name: 'Get_Activation_Fee',          api_code: 0x040d, op_code: 0x35 },
            { name: 'Put_Last_Block_GSig_In_A',    api_code: 0x040e, op_code: 0x32 },
            { name: 'Get_Asset_Circulating',       api_code: 0x040f, op_code: 0x35 },
            { name: 'Get_Account_Balance',         api_code: 0x0410, op_code: 0x35 }
        ],
    };


    if (typeof(machinecode)!= 'string') {
        throw "bad input type";
    }
    if (machinecode.length < 2 ) {
        throw "input type too small";
    }
    if (JSONmap === undefined || JSONmap.length < 2) {
        JSONmap = {
            Memory: [], // "VarName"
            Labels: [], // {"label": "__fn_process_TX", "address": 57 }
        }
    } else {
        JSONmap=JSON.parse(JSONmap)
    }
    
    var instructionset=[]; // { address: 23, label: "if25", instruction: [ "8n", "0n", "2an" ], assemblyline: "MUL @r0 $i" }


    machinecodeTOcodeobject();

    addAssemblyLine();

    addLabels();

    assembly_string="";
    JSONmap.Memory.forEach(varname => {
        assembly_string+="^declare "+varname+"\n";
    });

    assembly_string+="\n";

    instructionset.forEach ( function (Obj){
        if (Obj.label !== undefined) {
            assembly_string+=Obj.label.join(":\n")+":\n";
        }
        assembly_string+=Obj.assemblyline+"\n";
    });

    function machinecodeTOcodeobject () {
        var node, search;
        var currInstr;
        var pc=0 //program counter in chars

        //Reads 'size' bytes from machinecode input and return it as bigint.
        //Also advances 'pc'.
        function getBytes(size) {
            var ret_val=0n;
            var byte, byte_str;
            for (let i=0, multiplier=1n ; i<size; i++) {
                byte_str=machinecode.slice(pc+2*i, pc+2*i+2)
                byte=BigInt("0x"+byte_str);
                ret_val += multiplier*byte;
                multiplier*=256n;
            }
            pc+=2*size;
            return ret_val;
        }

        while (pc < machinecode.length) {
            node={ address: pc/2 };
            currInstr=[]
            currInstr.push(getBytes(1));

            if (currInstr[0] == 0) { //Most likely end of code with 00 padding end.
                continue;
            }

            search = ciyam_spec.op_code_table.find( obj => obj.op_code==currInstr[0]);
            if (search === null ) {
                throw "Invalid OpCode";
            }

            for (let i=0 ; i < search.args_type.length; i++) {
                let type=search.args_type.charAt(i);
                if (type == "I") {//variable (integer)
                    currInstr.push(getBytes(4));
                    continue;
                }
                if (type == "L") {// long value
                    currInstr.push(getBytes(8));
                    continue;
                }
                if (type == "B") { //branch offset (byte)
                    currInstr.push(getBytes(1));
                    continue;
                }
                if (type == "J") { //jump (integer)
                    currInstr.push(getBytes(4));
                    continue;
                }
                if (type == "F") { //API function (short)
                    currInstr.push(getBytes(2));
                    continue;
                }
            }
            node.instruction=currInstr;
            instructionset.push(node);
        }
    }

    function addAssemblyLine() {

        function getMapMemoryName(location) {
            var idx;
    
            if (location >= JSONmap.Memory.length) {
                for (idx=JSONmap.Memory.length; idx<=location; idx++) {
                    JSONmap.Memory.push("var"+idx.toString().padStart(2,"0"));
                }
            }
            return JSONmap.Memory[location];
        }

        function getMapLabelName(address) {
            let search = JSONmap.Labels.find( obj => obj.address==address);
            if (search === undefined ) {
                let lab="lab_"+address.toString(16);
                JSONmap.Labels.push( { address: address, label: lab } );
                return lab;
            }
            return search.label;
        }

        var search, CurrOp;
        for (let i=0; i< instructionset.length; i++) {
            CurrOp = instructionset[i];
            search = ciyam_spec.op_code_table.find( obj => obj.op_code==CurrOp.instruction[0]);
            if (search === null ) {
                throw "Invalid OpCode";
            }
            let assemblyInstruction=search.template;
            assemblyInstruction=assemblyInstruction.replace("%1", search.name);
            for (let j=0 ; j < search.args_type.length; j++) {
                let type=search.args_type.charAt(j);
                if (type == "I") {//variable (integer)
                    assemblyInstruction=assemblyInstruction.replace("%"+(j+2), getMapMemoryName(CurrOp.instruction[j+1]));
                    continue;
                }
                if (type == "L") {// long value
                    assemblyInstruction=assemblyInstruction.replace("%"+(j+2), CurrOp.instruction[j+1].toString(16).padStart(16,"0"));
                    continue;
                }
                if (type == "B") { //branch offset (byte)
                    if (CurrOp.instruction[j+1] > 0x7f) {
                        CurrOp.instruction[j+1]+=-256n;
                    }
                    assemblyInstruction=assemblyInstruction.replace("%"+(j+2), getMapLabelName(BigInt(CurrOp.address) + CurrOp.instruction[j+1] ));
                    continue;
                }
                if (type == "J") { //jump (integer)
                    assemblyInstruction=assemblyInstruction.replace("%"+(j+2), getMapLabelName(CurrOp.instruction[j+1]));
                    continue;
                }
                if (type == "F") { //API function (short)
                    let api_search = ciyam_spec.api_code_table.find( obj => obj.api_code==CurrOp.instruction[j+1]);
                    if (api_search === undefined) {
                        throw "Invalid api function code";
                    }
                    assemblyInstruction=assemblyInstruction.replace("%"+(j+2), api_search.name);
                    continue;
                }
            }
            CurrOp.assemblyline=assemblyInstruction;
        }
    }

    function addLabels() {

        JSONmap.Labels.forEach( function (LabelObj) {
            let search = instructionset.find( obj => obj.address==LabelObj.address);
            if (search === undefined) {
                throw "Label without instruction?";
            }
            //Maybe more than one label pointing here
            //This only happens if MAP has this condition.
            if (search.label === undefined) {
                search.label = [ LabelObj.label ];
            } else {
                search.label.push(LabelObj.label)
            }
        });
    }

    return { JSONmap: JSONmap, AssemblyProgram: assembly_string };
}
