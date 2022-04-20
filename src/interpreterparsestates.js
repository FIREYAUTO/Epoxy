/*************************\
         Imports
\*************************/

import {ErrorHandler} from "https://fireyauto.github.io/Epoxy/src/errorhandling.js";
import {EpoxyState} from "https://fireyauto.github.io/Epoxy/src/interpreterstate.js";
import {ASTBase,ASTNode,ASTBlock} from "https://fireyauto.github.io/Epoxy/src/astclasses.js";

/*************************\
      Internal States
\*************************/

const OperatorStateChecks = {
	TypeCheck:async(stk,s,a,t=[],ex="")=>{
		let ty=await OperatorStates.type(stk,s,a);
		if(!t.includes(ty))ErrorHandler.InterpreterError(s,"ExpectedGotStop",[`types ${t.join(", ")}`,`type ${ty}${ex}`]);
		return ty;
	},
	MultiTypeCheck:async(stk,s,a=[],t=[],ex="")=>{
		for(let k in a)await this.TypeCheck(stk,s,a[k],t,`${ex} (argument ${k})`);
	},
	GetMethod:async(stk,s,a,m)=>{
		let t=await OperatorStates.type(stk,s,a);
		if(t!="object")return;
		return a["__"+m];
	},
};

const OperatorSettings = {
	MathTypes:["string","number","object"],	
}

const OperatorStates = {
	add:async(stk,s,a,b)=>{
		await OperatorStateChecks.MultiTypeCheck(stk,s,[a,b],OperatorSettings.MathTypes," while doing math operation +");
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"add");
		if(m)return await m(stk,s,a,b);
		return a+b
	},
	sub:async(stk,s,a,b)=>{
		await OperatorStateChecks.MultiTypeCheck(stk,s,[a,b],OperatorSettings.MathTypes," while doing math operation -");
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"sub");
		if(m)return await m(stk,s,a,b);
		return a-b
	},
	mul:async(stk,s,a,b)=>{
		await OperatorStateChecks.MultiTypeCheck(stk,s,[a,b],OperatorSettings.MathTypes," while doing math operation *");
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"mul");
		if(m)return await m(stk,s,a,b);
		return a*b
	},
	div:async(stk,s,a,b)=>{
		await OperatorStateChecks.MultiTypeCheck(stk,s,[a,b],OperatorSettings.MathTypes," while doing math operation /");
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"div");
		if(m)return await m(stk,s,a,b);
		return a/b
	},
	mod:async(stk,s,a,b)=>{
		await OperatorStateChecks.MultiTypeCheck(stk,s,[a,b],OperatorSettings.MathTypes," while doing math operation %");
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"mod");
		if(m)return await m(stk,s,a,b);
		return a%b
	},
	pow:async(stk,s,a,b)=>{
		await OperatorStateChecks.MultiTypeCheck(stk,s,[a,b],OperatorSettings.MathTypes," while doing math operation ^");
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"pow");
		if(m)return await m(stk,s,a,b);
		return a**b
	},
	index:async(stk,s,a,b)=>{
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"index");
		if(m&&!Object.prototype.hasOwnProperty.call(a,b))return await m(stk,s,a,b);
		return a[b]
	},
	setIndex:async(stk,s,a,b,c)=>{
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"newindex");
		if(m&&!Object.prototype.hasOwnProperty.call(a,b))return await m(stk,s,a,b,c);
		return a[b]=c
	},
	unm:async(stk,s,a)=>{
		await OperatorStateChecks.TypeCheck(stk,s,a,["number","object"]," while doing the unm operation");
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"unm");
		if(m)return await m(stk,s,a);
		return -a
	},
	not:async(stk,s,a)=>{
		let t=await OperatorStates.type(stk,s,a);
		if(t==="boolean"||t==="null")return !a;
		return false
	},
	and:async(stk,s,a,b)=>{
		if(await OperatorStates.eq(stk,s,a,0))return b;
		return a&&b
	},
	or:async(stk,s,a,b)=>{
		if(await OperatorStates.eq(stk,s,a,0))return a;
		return a||b
	},
	eq:async(stk,s,a,b)=>{
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"eq");
		if(m)return await m(stk,s,a,b);
		return a===b
	},
	gt:async(stk,s,a,b)=>{
		await OperatorStateChecks.TypeCheck(stk,s,a,["number","object"]," while doing the logical operation >");
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"lt");
		if(m)return await m(stk,s,b,a);
		return a>b
	},
	geq:async(stk,s,a,b)=>{
		await OperatorStateChecks.TypeCheck(stk,s,a,["number","object"]," while doing the logical operation >=");
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"leq");
		if(m)return await m(stk,s,b,a);
		return await OperatorStates.and(stk,s,await OperatorStates.gt(stk,s,a,b),await OperatorStates.eq(stk,s,a,b))
	},
	lt:async(stk,s,a,b)=>{
		await OperatorStateChecks.TypeCheck(stk,s,a,["number","object"]," while doing the logical operation <");
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"lt");
		if(m)return await m(stk,s,a,b);
		return a<b
	},
	leq:async(stk,s,a,b)=>{
		await OperatorStateChecks.TypeCheck(stk,s,a,["number","object"]," while doing the logical operation <=");
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"leq");
		if(m)return await m(stk,s,a,b);
		return await OperatorStates.and(stk,s,await OperatorStates.lt(stk,s,a,b),await OperatorStates.eq(stk,s,a,b))
	},
	neq:async(stk,s,a,b)=>{
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"eq");
		if(m)return await OperatorStates.not(stk,s,await m(stk,s,a,b));
		return await OperatorStates.not(stk,s,await OperatorStates.eq(stk,s,a,b));
	},
	len:async(stk,s,a)=>{
		await OperatorStateChecks.TypeCheck(stk,s,a,["array","string","object"]," while doing the length operation");
		let m=await OperatorStateChecks.GetMethod(stk,s,a,"len");
		if(m)return await m(stk,s,a);
		return a.length
	},
	type:async(stk,s,a)=>{
		let type=typeof a;
		if(type==="object"&&a instanceof Array)return"array";
		if(a===undefined||a===null)return"null";
		return type;
	},
	if:async(stk,s,a)=>{
		return !(a===false||a===null||a===undefined);	
	},
};

const AssignmentStates = {
	0:async(stk,s,a,b)=>await b,
	1:async(stk,s,a,b)=>await OperatorStates.add(stk,s,a,b),
	2:async(stk,s,a,b)=>await OperatorStates.sub(stk,s,a,b),
	3:async(stk,s,a,b)=>await OperatorStates.mul(stk,s,a,b),
	4:async(stk,s,a,b)=>await OperatorStates.div(stk,s,a,b),
	5:async(stk,s,a,b)=>await OperatorStates.mod(stk,s,a,b),
	6:async(stk,s,a,b)=>await OperatorStates.pow(stk,s,a,b),
}

/*************************\
          States
\*************************/

const InterpreterStates = {
	GetVariable:async function(State,Token){
		return State.GetVariable(Token.Read("Name"));
	},
	NewVariable:async function(State,Token){
		let Variables = Token.Read("Variables");
		for(let Variable of Variables)State.NewVariable(Variable.Name,await this.Parse(State,Variable.Value));
	},
	NewDestructuringVariable:async function(State,Token){
		let Variables = Token.Read("Variables"),
		    Values = await this.ParseArray(State,Token.Read("Values"));
		let New = [];
		for(let Value of Values){
			if (Value instanceof this.UnpackStateClass){
				for(let v of Value.List)New.push(v);	
			}else{
				New.push(Value);	
			}
		}
		for(let Key in Variables){
			Key=+Key;
			let Variable=Variables[Key];
			State.NewVariable(Variable.Name,New[Key]);
		}
	},
	DestructuringAssignment:async function(State,Token){
		let Names = Token.Read("Names"),
		    Values = await this.ParseArray(State,Token.Read("Values"));
		for(let k in Names){
			let v=Names[k=+k],
			    vv=Values[k];
			if(vv===undefined)vv=null;
			State.SetVariable(v,vv);
		}
		return Values;
	},
	Assignment:async function(State,Token){
		let Name = Token.Read("Name"),
			Value = await this.Parse(State,Token.Read("Value")),
			Call = AssignmentStates[Token.Read("Type")];
		if(Name instanceof ASTBase){
			if(Name.Type==="GetVariable"){
				Name = Name.Read("Name");
				let Variable=State.GetGlobalRawVariable(Name);
				if(Variable){
					let Previous=Variable.Value;
					State.SetVariable(Name,await Call(this,State,Variable.Value,Value));
					return Variable.Value;
				}else{
					let Result=await Call(this,State,null,Value);
					State.SetVariable(Name,Result);
					return Result;
				}
			}else if(Name.Type==="GetIndex"){
				let Obj = await this.Parse(State,Name.Read("Object")),
					Index = await this.Parse(State,Name.Read("Index")),
					ObjIndex = await OperatorStates.index(this,State,Obj,Index);
				let Result = await Call(this,State,ObjIndex,Value);
				await OperatorStates.setIndex(this,State,Obj,Index,Result);
				return Result;
			}
		}else{
			ErrorHandler.InterpreterError(Token,"Unexpected",["assignment operator"]);
		}
	},
	Add:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return await OperatorStates.add(this,State,V1,V2);
	},
	Sub:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return await OperatorStates.sub(this,State,V1,V2);
	},
	Mul:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return await OperatorStates.mul(this,State,V1,V2);
	},
	Div:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return OperatorStates.div(this,State,V1,V2);
	},
	Mod:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return await OperatorStates.mod(this,State,V1,V2);
	},
	Pow:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return await OperatorStates.pow(this,State,V1,V2);
	},
	Negative:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1"));
		return await OperatorStates.unm(this,State,V1);
	},
	Not:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1"));
		return await OperatorStates.not(this,State,V1);
	},
	And:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1"));
		if(await OperatorStates.if(this,State,V1)){
			let V2 = await this.Parse(State,Token.Read("V2"));
			return await OperatorStates.and(this,State,V1,V2);
		}else return V1;
	},
	Or:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1"));
		if(!await OperatorStates.if(this,State,V1)){
			let V2 = await this.Parse(State,Token.Read("V2"));
			return await OperatorStates.or(this,State,V1,V2);
		}else return V1;
	},
	Eq:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return await OperatorStates.eq(this,State,V1,V2);
	},
	Lt:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return await OperatorStates.lt(this,State,V1,V2);
	},
	Leq:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return await OperatorStates.leq(this,State,V1,V2);
	},
	Gt:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return await OperatorStates.gt(this,State,V1,V2);
	},
	Geq:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return await OperatorStates.geq(this,State,V1,V2);
	},
	Neq:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return await OperatorStates.neq(this,State,V1,V2);
	},
	Call:async function(State,Token){
		let Call = await this.Parse(State,Token.Read("Call")),
			Arguments = await this.ParseArray(State,Token.Read("Arguments"));
		if(!(Call instanceof Function))ErrorHandler.InterpreterError(Token,"Attempt",["to call non-function"]);
		return await Call(this,State,...Arguments);
	},
	SelfCall:async function(State,Token){
		let Obj = await this.Parse(State,Token.Read("Object")),
		    Index = await this.Parse(State,Token.Read("Index")),
		    Arguments = await this.ParseArray(State,Token.Read("Arguments")),
		    Call = await OperatorStates.index(this,State,Obj,Index);
		if(!(Call instanceof Function))ErrorHandler.InterpreterError(Token,"Attempt",[`to call non-function ${Index}`]);
		return await Call(this,State,Obj,...Arguments);
	},
	Array:async function(State,Token){
		let List = Token.Read("List"),
		    Result = [];
		for(let v of List){
			let d = await this.Parse(State,v,true);
			if(d instanceof this.UnpackStateClass)for(let x of d.List)Result.push(x);
			else Result.push(d);
		}
		return Result;
	},
	Object:async function(State,Token){
		let Obj = Token.Read("Object"),
		    Result = {};
		for(let V of Obj)
			if(V.Value===undefined)Result[V.Name]=State.GetVariable(V.Name);
			else Result[await this.Parse(State,V.Name)]=await this.Parse(State,V.Value);
		return Result;
	},
	If:async function(State,Token){
		let Expression = await this.Parse(State,Token.Read("Expression")),
		    Conditions = Token.Read("Conditions"),
		    Body = Token.Read("Body");
		if(await OperatorStates.if(this,State,Expression)){
			let NewState = new EpoxyState(Body,State);
			await this.ParseState(NewState);
		}else{
			for(let Condition of Conditions){
				if(Condition.Type === "ElseIf"){
					let Exp = await this.Parse(State,Condition.Read("Expression")),
					    Bd = Condition.Read("Body");
					if(await OperatorStates.if(this,State,Exp)){
						let NewState = new EpoxyState(Bd,State);
						await this.ParseState(NewState);
						break;
					}
				}else if(Condition.Type === "Else"){
					let Bd = Condition.Read("Body");
					let NewState = new EpoxyState(Bd,State);
					await this.ParseState(NewState);
					break;
				}
			}
		}
	},
	While:async function(State,Token){
		let Expression = Token.Read("Condition"),
			Body = Token.Read("Body");
		while(await OperatorStates.if(this,State,await this.Parse(State,Expression))){
			let NewState = new EpoxyState(Body,State,{InLoop:true,IsLoop:true});
			await this.ParseState(NewState);
			if(!NewState.Read("InLoop"))break;
		}
	},
	For:async function(State,Token){
		let Variables = Token.Read("Variables"),
			Expression = Token.Read("Condition"),
			Body = Token.Read("Body"),
			Increment = Token.Read("Increment");
		let ProxyState = new EpoxyState({Data:[],Line:Token.Line,Index:Token.Index},State);
		for(let Variable of Variables)ProxyState.NewVariable(Variable.Name,await this.Parse(ProxyState,Variable.Value));
		while(await OperatorStates.if(this,State,await this.Parse(ProxyState,Expression))){
			let NewState = new EpoxyState(Body,ProxyState,{InLoop:true,IsLoop:true});
			await this.ParseState(NewState);
			if(!NewState.Read("InLoop"))break;
			await this.Parse(ProxyState,Increment);
		}
		ProxyState.Close();
	},
	IterationLoop:async function(State,Token){
		let Variables = Token.Read("Variables"),
		    Getters = Token.Read("Getters"),
		    Iterator = await this.Parse(State,Token.Read("Object")),
		    Body = Token.Read("Body");
		for(let k in Iterator){
			let v=Iterator[k],
			    NewState = new EpoxyState(Body,State,{InLoop:true,IsLoop:true}),
			    Gets=[k,v];
			for(let Key in Variables){
				let Variable = Variables[Key];
				NewState.NewVariable(Variable.Name,Gets[Getters[Key]]);
			}
			await this.ParseState(NewState);
			if(!NewState.Read("InLoop"))break;
		}
	},
	Return:async function(State,Token){
		let Expressions = await this.ParseArray(State,Token.Read("Expression"));
		State.Write("Returned",true);
		State.Write("Returns",Expressions);
	},
	Break:async function(State,Token){
		State.Write("Break",true);	
	},
	Continue:async function(State,Token){
		State.Write("Continue",true);	
	},
	NewFunction:async function(State,Token){
		State.NewVariable(Token.Read("Name"),await this.FunctionState(State,Token));	
	},
	NewFastFunction:async function(State,Token){
		return await this.FunctionState(State,Token);	
	},
	GetIndex:async function(State,Token){
		let Obj = await this.Parse(State,Token.Read("Object")),
		    Index = await this.Parse(State,Token.Read("Index"));
		return await OperatorStates.index(this,State,Obj,Index);
	},
	Length:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1"));
		return await OperatorStates.len(this,State,V1);
	},
	/*
	*/
}

/*************************\
          Exports
\*************************/

export {InterpreterStates,OperatorStates,AssignmentStates};
