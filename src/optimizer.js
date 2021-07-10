 // Deeper assembly code optimization
 function optimizer(source){
    var tmplines =  source.split("\n");

    var jumpToLabels;
    var jmpto, lbl, dest;
    var setdat, opdat, clrdat, popdat, pshdat, setval, inddat;
    var line1, line2, line3, line4;
    var psh_slp_dat;
    var optimized_lines;
    var optimized_cycles=0;

    do {
        jumpToLabels=[];
        optimized_lines = 0;
        optimized_cycles++;

        //Collect jumps information
        tmplines.forEach( function (value) {
                jmpto = /.+\s:(\w+)$/.exec(value); //match JMP JSR ERR and all branches
                if (jmpto!== null) {
                    jumpToLabels.push(jmpto[1]);
                }
            });

        //remove labels without reference
        //remove lines marked as DELETE
        tmplines = tmplines.filter( function (value){
                lbl = /^(\w+):$/.exec(value);
                if (lbl !== null) {
                    if (jumpToLabels.indexOf(lbl[1]) != -1) {
                        return true;
                    } else {
                        optimized_lines++;
                        return false;
                    }
                }
                if (value == "DELETE") {
                    optimized_lines++;
                    return false;
                }
                return true;
            });

        tmplines.forEach( function (value, index, array){
            var i;

            /*
            // change SET_VAL to SET_DAT for values defined in ConstVars
            // This also enables more optimizations on pointers and PSH!
            if (bc_Big_ast.Config.maxConstVars > 0) {
                setdat = /^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/.exec(value);
                if (setdat !== null) {
                    let val=parseInt(setdat[2],16);
                    if (val <= bc_Big_ast.Config.maxConstVars && setdat[1] !== "n"+val) {
                        array[index]="SET @"+setdat[1]+" $n"+val;
                        optimized_lines++;
                    }
                }
            }
            */

            //do not analyze these values or compiler directives
            if (value == "DELETE" || value == "" || /^\s*\^\w+(.*)/.exec(array[i]) != null) {
                return;
            }


            //Branches optimization! high gain, so come first!
            line1 = /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(value);
            if (line1 != null) {
                line2 = /^\s*SUB\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+1]);
                if (line2 != null && line1[1] == line2[1]) {
                    line3 = /^\s*(BZR|BNZ)\s+\$(\w+)\s+:(\w+)\s*$/.exec(array[index+2]);
                    //SET @r0 $var20
                    //SUB @r0 $var21
                    //BNZ/BZR $r0 :lab_114b
                    // turns BNE/BEQ $var20 $var21 :lab_114b
                    if (line3 != null && line3[2] == line2[1]) {
                        var instr;
                        if (line3[1] == "BNZ") instr="BNE";
                        else instr = "BEQ";
                        array[index] = instr + " $" + line1[2] + " $" + line2[2] + " :" + line3[3];
                        array[index+1]="DELETE";
                        array[index+2]="DELETE";
                        optimized_lines++;
                        return;
                    }


                    //SET @r0 $var30
                    //SUB @r0 $var36
                    //CLR @r1
                    //BGT/BLT/BGE/BLE $r0 $r1 :lab_52f
                    // turns BGT/BLT/BGE/BLE $var30 $var36 :lab_52f
                    line3 = /^\s*CLR\s+@(\w+)\s*$/.exec(array[index+2]);
                    if (line3 != null) {
                        line4 = /^\s*(BGT|BLT|BGE|BLE)\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/.exec(array[index+3])
                        if (line4 != null && line4[2] == line2[1] && line4[3] == line3[1]) {
                            array[index] = line4[1] + " $" + line1[2] + " $" + line2[2] + " :" + line4[4];
                            array[index+1]="DELETE";
                            array[index+2]="DELETE";
                            array[index+3]="DELETE";
                            optimized_lines++;
                            return;    
                        }
                    }
                }


                //SET @r0 $var62
                //BNZ/BZR $r0 :lab_72b
                //turns BNZ/BZR $var62 :lab_72b
                line2 = /^\s*(BZR|BNZ)\s+\$(\w+)\s+:(\w+)\s*$/.exec(array[index+1]);
                if (line2 != null && line2[2] == line1[1]) {
                    array[index] = line2[1] + " $" + line1[2] + " :" + line2[3];
                    array[index+1]="DELETE";
                    optimized_lines++;
                    return;
                }


            }

            //let this optimization to end
            // WARNING: breaks code from SmartC
            if (optimized_cycles>2) {
                line1 = /^\s*SUB\s+@(\w+)\s+\$(\w+)\s*$/.exec(value);
                if (line1 != null) {
                    line2 = /^\s*(BZR|BNZ)\s+\$(\w+)\s+:(\w+)\s*$/.exec(array[index+1]);

                    //SUB @r0 $var41
                    //BZR/BNZ $r0 :lab_431
                    // turns BEQ/BNE $r0 $var41 :lab_431   //linha254
                    if (line2 != null && line2[2] == line1[1]) {
                        var instr;
                        if (line2[1] == "BNZ") instr="BNE";
                        else instr = "BEQ";
                        array[index] = instr + " $" + line2[2] + " $" + line1[2] + " :" + line2[3];
                        array[index+1]="DELETE";
                        optimized_lines++;
                        return;
                    }


                    //SUB @r0 $var37
                    //CLR @r1
                    //BGT $r0 $r1 :lab_b22
                    // turns BGT $r0 $var37 :lab_422
                    line2 = /^\s*CLR\s+@(\w+)\s*$/.exec(array[index+1]);
                    if (line2 != null) {
                        line3 = /^\s*(BGT|BLT|BGE|BLE)\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/.exec(array[index+2])
                        if (line3 != null && line3[2] == line1[1] && line3[3] == line2[1]) {
                            array[index] = line3[1] + " $" + line1[1] + " $" + line1[2] + " :" + line3[4];
                            array[index+1]="DELETE";
                            array[index+2]="DELETE";
                            optimized_lines++;
                            return;    
                        }
                    }
                }
            }

            //BNE $r0 $var37 :lab_f75
            //JMP :lab_fa2
            //lab_f75:
            //  turns BEQ $r0 $var37 :lab_fa2
            line1 = /^\s*(BGT|BLT|BGE|BLE|BEQ|BNE)\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/.exec(value);
            if (line1 != null) {
                line3 = /^\s*(\w+):\s*$/.exec(array[index+2]);
                if (line3 != null && line1[4] == line3[1]) {
                    line2 = /^\s*JMP\s+:(\w+)\s*$/.exec(array[index+1]);
                    if (line2 != null) {

                        //if jump location is RET or FIN, optimize to RET or FIN.
                        dest = getLabeldestination(line2[1]);
                        if (/^\s*RET\s*$/.exec(dest) !== null ){
                            array[index+1] = "RET"; //if jump to return, just return from here
                            optimized_lines++;
                            return;
                        }
                        if (/^\s*FIN\s*$/.exec(dest) !== null ){
                            array[index+1] = "FIN"; //if jump to exit, just exit from here
                            optimized_lines++;
                            return;
                        }

                        var instr;
                        if      (line1[1] == "BGT") instr="BLE";
                        else if (line1[1] == "BLT") instr="BGE";
                        else if (line1[1] == "BGE") instr="BLT";
                        else if (line1[1] == "BLE") instr="BGT";
                        else if (line1[1] == "BEQ") instr="BNE";
                        else instr="BEQ";
                        array[index] = instr + " $" + line1[2] + " $" + line1[3] + " :" + line2[1];
                        array[index+1]="DELETE";
                        optimized_lines++;
                        return;
                    }
                }
            }

            //BNZ $r0 :lab_f75
            //JMP :lab_fa2
            //lab_f75:
            //  turns BZR $r0 :lab_fa2
            line1 = /^\s*(BZR|BNZ)\s+\$(\w+)\s+:(\w+)\s*$/.exec(value);
            if (line1 != null) {
                line3 = /^\s*(\w+):\s*$/.exec(array[index+2]); //matches labels
                if (line3 != null && line1[4] == line3[1]) {
                    line2 = /^\s*JMP\s+:(\w+)\s*$/.exec(array[index+1]);
                    if (line2 != null) {

                        //if jump location is RET or FIN, optimize to RET or FIN.
                        dest = getLabeldestination(line2[1]);
                        if (/^\s*RET\s*$/.exec(dest) !== null ){
                            array[index+1] = "RET"; //if jump to return, just return from here
                            optimized_lines++;
                            return;
                        }
                        if (/^\s*FIN\s*$/.exec(dest) !== null ){
                            array[index+1] = "FIN"; //if jump to exit, just exit from here
                            optimized_lines++;
                            return;
                        }

                        var instr;
                        if (line1[1] == "BZR") instr="BNZ";
                        else instr="BZR";
                        array[index] = instr + " $" + line1[2] + " :" + line2[1];
                        array[index+1]="DELETE";
                        optimized_lines++;
                        return;
                    }
                }
            }



            jmpto = /^\s*JMP\s+:(\w+)\s*$/.exec(value);
            //optimize jumps
            if (jmpto !== null) {
                //if instruction is jump, unreachable code until a label found
                i=index;
                while (++i<array.length-1) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[i]);
                    if ( lbl === null) {
                        if (array[i] === "" || array[i] === "DELETE") {
                            continue;
                        }
                        array[i]="DELETE"
                        optimized_lines++;
                        continue;
                    }
                    break;
                }
                //if referenced label is next instruction, meaningless jump
                i=index;
                while (++i<array.length-1) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[i]);
                    if ( lbl === null) {
                        if (array[i] === "" || array[i] === "DELETE") {
                            continue;
                        }
                        break;
                    }
                    if (jmpto[1] === lbl[1]) {
                        array[index]="DELETE"
                        optimized_lines++;
                        return;
                    }
                }
                //inspect jump location
                dest = getLabeldestination(jmpto[1]);
                if (/^\s*RET\s*$/.exec(dest) !== null ){
                    array[index] = "RET"; //if jump to return, just return from here
                    optimized_lines++;
                    return;
                }
                if (/^\s*FIN\s*$/.exec(dest) !== null ){
                    array[index] = "FIN"; //if jump to exit, just exit from here
                    optimized_lines++;
                    return;
                }
                lbl = /^\s*(\w+):\s*$/.exec(dest);
                if (lbl !== null) {
                    array[index] = "JMP :"+lbl[1]; //if jump to other jump, just jump over there
                    optimized_lines++;
                    return;
                }
            }

            jmpto = /^\s*(RET|FIN)\s*$/.exec(value);
            //Inspect RET and FIN
            if (jmpto !== null) {
                //if instruction RET or FIN, unreachable code until a label found
                i=index;
                while (++i<array.length-1) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[i]);
                    if ( lbl === null) {
                        if (array[i] === "" || array[i] === "DELETE") {
                            continue;
                        }
                        array[i]="DELETE"
                        optimized_lines++;
                        continue;
                    }
                    break;
                }
            }

            //inspect branches and optimize branch to jumps
            jmpto = /^\s*B.+:(\w+)$/.exec(value); //matches all branches instructions
            if (jmpto !== null) {
                //if referenced label is next instruction, meaningless jump
                i=index;
                while (++i<array.length-1) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[i]);
                    if ( lbl === null) {
                        if (array[i] === "" || array[i] === "DELETE") {
                            continue;
                        }
                        break;
                    }
                    if (jmpto[1] === lbl[1]) {
                        array[index]="DELETE"
                        optimized_lines++;
                        return;
                    }
                }
                //inspect jump location
                dest = getLabeldestination(jmpto[1]);
                lbl = /^\s*(\w+):\s*$/.exec(dest);
                if (lbl !== null) {
                    array[index] = jmpto[0].replace(jmpto[1], lbl[1]); //if branch to other jump, just branch over there
                    optimized_lines++;
                    return;
                }
            }

            //ADD @r0 $b
            //SET @b $r0
            // turns ADD @b $r0
            opdat=/^\s*(\w+)\s+@(\w+)\s+\$(\w+)\s*$/.exec(value);
            if (opdat !== null) {
                setdat = /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+1]);
                if ( setdat !== null && opdat[2] == setdat[2] && opdat[3] == setdat[1]) {
                    if (opdat[1] === "ADD" || opdat[1] === "MUL" || opdat[1] === "AND" || opdat[1] === "XOR" || opdat[1] === "BOR" ) {
                        array[index]=opdat[1]+" @"+opdat[3]+" $"+opdat[2];
                        array[index+1]="DELETE";
                        optimized_lines++;
                        return;
                    }
                }
            }

            //SET @r0 $a
            //ADD @b $r0
            // turns ADD @b $a
            setdat=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(value);
            if (setdat !== null) {
                opdat = /^\s*(\w+)\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+1]);
                if ( opdat !== null && setdat[1] == opdat[3]) {
                    if (opdat[1] === "ADD" || opdat[1] === "SUB" || opdat[1] === "MUL" || opdat[1] === "DIV" ||
                        opdat[1] === "AND" || opdat[1] === "XOR" || opdat[1] === "BOR" ||
                        opdat[1] === "MOD" || opdat[1] === "SHL" || opdat[1] === "SHR" ) {
                        array[index]=opdat[1]+" @"+opdat[2]+" $"+setdat[2];
                        array[index+1]="DELETE";
                        optimized_lines++;
                        return;
                    }
                    if (opdat[1] === "SET" ) {
                        if ( opdat[2] != setdat[2]) {
                            array[index]=opdat[1]+" @"+opdat[2]+" $"+setdat[2];
                            array[index+1]="DELETE";
                            optimized_lines++;
                            return;
                        } else {
                            array[index+1]="DELETE";
                            optimized_lines++;
                            return;
                        }
                    }
                }

                //SET @r0 $a
                //PSH $r0 / SLP $r0
                // turns PSH $a / SLP $a
                psh_slp_dat=/^\s*(PSH|SLP)\s+\$(\w+)\s*$/.exec(array[index+1]);
                if (psh_slp_dat !== null) {
                    if (psh_slp_dat[2] == setdat[1]) {
                        array[index]="DELETE";
                        array[index+1]=psh_slp_dat[1]+" $"+setdat[2];
                        optimized_lines++;
                        return;
                    }
                }

                i=index;
                while (++i<array.length-1) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[i]);
                    if ( lbl !== null) {
                        break;
                    }
                    jmpto = /.+\s:(\w+)$/.exec(array[i]); //match JMP JSR ERR and all branches
                    if (jmpto !== null) {
                        break;
                    }
                    jmpto = /^\s*(RET|FIN)\s*$/.exec(array[i]);
                    if (jmpto !== null) {
                        break;
                    }
                    if (array[i].indexOf(setdat[1]) >= 0) {
                        //SET @r0 $a
                        //SET @z $($val + $r0)
                        // turns SET @z $($val + $a)
                        let setdat2 = /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/.exec(array[i]);
                        if (setdat2 !== null && setdat[1] == setdat2[3]) {
                            array[index]="DELETE";
                            array[i]="SET @"+setdat2[1]+" $($"+setdat2[2]+" + $"+setdat[2]+")";
                            optimized_lines++;
                            continue;
                        }
                        //SET @r0 $a
                        //SET @($val + $r0) $z
                        // turns SET $($val + $a) $z
                        setdat2 = /^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/.exec(array[i]);
                        if (setdat2 !== null && setdat[1] == setdat2[2]) {
                            array[index]="DELETE";
                            array[i]="SET @($"+setdat2[1]+" + $"+setdat[2]+") $"+setdat2[3];
                            optimized_lines++;
                            continue;
                        }
                        //SET @r0 $a
                        //SET @($val + $z) $r0
                        // turns SET $($val + $z) $a
                        if (setdat2 !== null && setdat[1] == setdat2[3]) {
                            array[index]="DELETE";
                            array[i]="SET @($"+setdat2[1]+" + $"+setdat2[2]+") $"+setdat[2];
                            optimized_lines++;
                            continue;
                        }
                        break;
                    }
                }
                if (setdat[1] == setdat[2]) { //SET @a_1 $a_1 turns delete
                    array[index]="DELETE";
                    optimized_lines++;
                    return;
                }

                //SET @r0 $var32
                //MUL @r0 $r1
                //SET @var32 $r0
                // turns MUL @var32 $r1
                let setdat3 = /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+2]);
                if (setdat3 !== null && setdat[1] == setdat3[2] && setdat[2] == setdat3[1] ) {
                    opdat = /^\s*(\w+)\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+1]);
                    if ( opdat !== null && setdat[1] == opdat[2]) {
                        if (opdat[1] === "ADD" || opdat[1] === "SUB" || opdat[1] === "MUL" || opdat[1] === "DIV" ||
                            opdat[1] === "AND" || opdat[1] === "XOR" || opdat[1] === "BOR" ||
                            opdat[1] === "MOD" || opdat[1] === "SHL" || opdat[1] === "SHR" ) {
                            array[index]=opdat[1]+" @"+setdat[2]+" $"+opdat[3];
                            array[index+1]="DELETE";
                            array[index+2]="DELETE";
                            optimized_lines++;
                            return;
                        }
                    }
                }
    

            }

            //SET @var16 $($var17)
            //SET @var09 $var16
            //turns SET @var09 $($var17)
            setind=/^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\)\s*$/.exec(value);
            if (setind !== null) {
                setdat=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+1]);
                if ( setdat !== null && setdat[2] == setind[1]) {
                    array[index]="SET @"+setdat[1]+" $($"+setind[2]+")";
                    array[index+1]="DELETE";
                    optimized_lines++;
                    return;
                }
            }

            //SET @var17 $var23
            //SET @var17 $($var17)
            //turns SET @var17 $($var23)
            setdat=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(value);
            if (setdat !== null) {
                setind=/^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\)\s*$/.exec(array[index+1]);
                if ( setind !== null && setdat[1] == setind[2]) {
                    array[index]="SET @"+setind[1]+" $($"+setdat[2]+")";
                    array[index+1]="DELETE";
                    optimized_lines++;
                    return;
                }
            }
            //SET @r1 $var67
            //SET @($r1) $var24
            //turns SET @($var67) $var24
            setdat=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(value);
            if (setdat !== null) {
                inddat=/^\s*SET\s+@\(\$(\w+)\)\s+\$(\w+)\s*$/.exec(array[index+1]);
                if ( inddat !== null && setdat[1] == inddat[1]) {
                    array[index]="SET @($"+setdat[2]+") $"+inddat[2]+"";
                    array[index+1]="DELETE";
                    optimized_lines++;
                    return;
                }
            }

            //SET @var17 #0000000000000020
            //SET @var03 $var17
            //turns SET @var03 #0000000000000020
            setval=/^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/.exec(value);
            if (setval !== null) {
                setdat=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+1]);
                if ( setdat !== null && setdat[2] == setval[1]) {
                    array[index]="SET @"+setdat[1]+" #"+setval[2];
                    array[index+1]="DELETE";
                    optimized_lines++;
                    return;
                }
            }

            //FUN @r0 get_B1
            //SET @var14 $r0
            //turns FUN @var14 get_B1
            // avoid double otimization on this instruction!!!!!!!!
            fundat=/^\s*FUN\s+@(\w+)\s+(\w+)\s*$/.exec(value);
            if (fundat !== null) {
                setdat=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+1]);
                if ( setdat !== null && setdat[2] == fundat[1]) {
                    array[index]="#FUN @"+setdat[1]+" "+fundat[2];
                    array[index+1]="DELETE";
                    optimized_lines++;
                    return;
                }
            }

            //POP @r0
            //SET @z $r0
            // turns POP @z
            // WARNING: breaks code from blocktalk
            /* popdat=/^\s*POP\s+@(\w+)\s*$/.exec(value);
            if (popdat !== null) {
                setdat=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+1]);
                if ( setdat !== null && setdat[2] == popdat[1]) {
                    array[index]="POP @"+setdat[1];
                    array[index+1]="DELETE";
                    optimized_lines++;
                    return;
                }
            } */

            //PSH $var22
            //POP @var16
            //turns SET @var16 $var22
            pshdat=/^\s*PSH\s+\$(\w+)\s*$/.exec(value);
            if (pshdat !== null) {
                popdat=/^\s*POP\s+@(\w+)\s*$/.exec(array[index+1]);
                if ( popdat !== null ) {
                    array[index]="SET @"+popdat[1]+" $"+pshdat[1];
                    array[index+1]="DELETE";
                    optimized_lines++;
                    return;
                }

                i=index;
                while (++i<array.length-1) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[i]);
                    if ( lbl !== null) {
                        break;
                    }
                    jmpto = /.+\s:(\w+)$/.exec(array[i]); //match JMP JSR ERR and all branches
                    if (jmpto !== null) {
                        break;
                    }
                    jmpto = /^\s*(RET|FIN)\s*$/.exec(array[i]);
                    if (jmpto !== null) {
                        break;
                    }
                    let psh = /^\s*PSH\s+\$(\w+)\s*$/.exec(array[i]);
                    if (psh !== null) {
                        break;
                    }
                    if (array[i].indexOf(pshdat[1]) >= 0) {
                        //PSH $var22
                        //POP @var22
                        //turns DELETE BOTH
                        popdat=/^\s*POP\s+@(\w+)\s*$/.exec(array[i]);
                        if (popdat !== null && pshdat[1] == popdat[1]) {
                            array[index]="DELETE";
                            array[i]="DELETE";
                            optimized_lines++;
                            break;
                        }
                        break;
                    }
                }
            }

            clrdat=/^\s*CLR\s+@(\w+)\s*$/.exec(value);
            if (clrdat !== null) {
                //CLR @var17
                //SET @var03 $var17
                // turns CLR @var3
                setdat=/^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/.exec(array[index+1]);
                if ( setdat !== null && setdat[2] == clrdat[1]) {
                    array[index]="CLR @"+setdat[1];
                    array[index+1]="DELETE";
                    optimized_lines++;
                    return;
                }

                /* Specific for SmartC
                //Optimize pointer operations with zero index
                i=index;
                while (++i<array.length-1) {
                    lbl = /^\s*(\w+):\s*$/.exec(array[i]);
                    if ( lbl !== null) {
                        break;
                    }
                    jmpto = /.+\s:(\w+)$/.exec(array[i]); //match JMP JSR ERR and all branches
                    if (jmpto !== null) {
                        break;
                    }
                    jmpto = /^\s*(RET|FIN)\s*$/.exec(array[i]);
                    if (jmpto !== null) {
                        break;
                    }
                    if (array[i].indexOf(clrdat[1]) >= 0) {
                        setdat = /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/.exec(array[i]);
                        if (setdat !== null && clrdat[1] == setdat[3]) {
                            array[index]="DELETE";
                            array[i]="SET @"+setdat[1]+" $($"+setdat[2]+")";
                            optimized_lines++;
                            continue;
                        }
                        setdat = /^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/.exec(array[i]);
                        if (setdat !== null && clrdat[1] == setdat[2]) {
                            array[index]="DELETE";
                            array[i]="SET @($"+setdat[1]+") $"+setdat[3];
                            optimized_lines++;
                            continue;
                        }
                        break;
                    }
                }
                */
            }

        });
    } while (optimized_cycles <= 3 || optimized_lines != 0);


    function getLabeldestination(label) {
        var lbl, jmpdest;
        var idx = tmplines.findIndex( obj => obj.indexOf(label+":") != -1);
        if (idx == -1 ) {
            throw new TypeError("Could not find label '"+label+"' during optimizations.");
        }
        while (++idx<tmplines.length-1) {
            lbl = /^\s*(\w+):\s*$/.exec(tmplines[idx]);
            if ( lbl !== null) {
                continue;
            }
            if (tmplines[idx] === "" || tmplines[idx] === "DELETE") {
                continue;
            }
            jmpdest = /^\s*JMP\s+:(\w+)\s*$/.exec(tmplines[idx]);
            if (jmpdest !== null) {
                return jmpdest[1]+":";
            }
            return tmplines[idx]
        }
        throw new TypeError("Strange error during optimizations.");
    }

    //restore instructions optimized avoided double otimization
    tmplines.forEach( function(value, index, array) {
        var i;
        if (value.indexOf("#FUN") >= 0) {
            array[index]=value.replace("#FUN","FUN");
        }
    });

    return tmplines.join("\n");
}
