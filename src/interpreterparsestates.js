/*************************\
         Imports
\*************************/

import {ErrorHandler} from "https://fireyauto.github.io/Epoxy/src/errorhandling.js";
import {EpoxyState} from "https://fireyauto.github.io/Epoxy/src/interpreterstate.js";
import {ASTBase,ASTNode,ASTBlock} from "https://fireyauto.github.io/Epoxy/src/astclasses.js";

/*************************\
      Internal States
\*************************/

const OperatorStates = {
	add:(s,a,b)=>a+b,
	sub:(s,a,b)=>a-b,
	mul:(s,a,b)=>a*b,
	div:(s,a,b)=>a/b,
	mod:(s,a,b)=>a%b,
	pow:(s,a,b)=>a**b,
	index:(s,a,b)=>a[b],
	setIndex:(s,a,b,c)=>a[b]=c,
	unm:(s,a)=>-a,
	not:(s,a)=>!a,
	and:(s,a,b)=>a&&b,
	or:(s,a,b)=>a||b,
	eq:(s,a,b)=>a===b,
	gt:(s,a,b)=>a>b,
	geq:(s,a,b)=>a>=b,
	lt:(s,a,b)=>a<b,
	leq:(s,a,b)=>a<=b,
	neq:(s,a,b)=>a!=b,
	len:(s,a)=>a.length,
};

const AssignmentStates = {
	0:(s,a,b)=>b,
	1:(s,a,b)=>OperatorStates.add(s,a,b),
	2:(s,a,b)=>OperatorStates.sub(s,a,b),
	3:(s,a,b)=>OperatorStates.mul(s,a,b),
	4:(s,a,b)=>OperatorStates.div(s,a,b),
	5:(s,a,b)=>OperatorStates.mod(s,a,b),
	6:(s,a,b)=>OperatorStates.pow(s,a,b),
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
		    Value = await this.Parse(State,Token.Read("Value"));
		if (Value instanceof this.UnpackStateClass)Value=Value.List;
		for(let Key in Variables){
			Key=+Key;
			let Variable=Variables[Key];
			State.NewVariable(Variable.Name,Value[Key]);
		}
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
					State.SetVariable(Name,await Call(State,Variable.Value,Value));
					return Variable.Value;
				}else{
					let Result=await Call(State,null,Value);
					State.SetVariable(Name,Result);
					return Result;
				}
			}else if(Name.Type==="GetIndex"){
				let Obj = await this.Parse(State,Name.Read("Object")),
					Index = await this.Parse(State,Name.Read("Index")),
					ObjIndex = await OperatorStates.index(State,Obj,Index);
				let Result = await Call(State,ObjIndex,Value);
				await OperatorStates.setIndex(State,Obj,Index,Result);
				return Result;
			}
		}else{
			ErrorHandler.InterpreterError(Token,"Unexpected",["assignment operator"]);
		}
	},
	Add:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return OperatorStates.add(State,V1,V2);
	},
	Sub:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return OperatorStates.sub(State,V1,V2);
	},
	Mul:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return OperatorStates.mul(State,V1,V2);
	},
	Div:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return OperatorStates.div(State,V1,V2);
	},
	Mod:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return OperatorStates.mod(State,V1,V2);
	},
	Pow:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return OperatorStates.pow(State,V1,V2);
	},
	Negative:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1"));
		return OperatorStates.unm(State,V1);
	},
	Not:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1"));
		return OperatorStates.not(State,V1);
	},
	And:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1"));
		if(V1){
			let V2 = await this.Parse(State,Token.Read("V2"));
			return OperatorStates.and(State,V1,V2);
		}else return V1;
	},
	Or:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1"));
		if(!V1){
			let V2 = await this.Parse(State,Token.Read("V2"));
			return OperatorStates.or(State,V1,V2);
		}else return V1;
	},
	Eq:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return OperatorStates.eq(State,V1,V2);
	},
	Lt:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return OperatorStates.lt(State,V1,V2);
	},
	Leq:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return OperatorStates.leq(State,V1,V2);
	},
	Gt:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return OperatorStates.gt(State,V1,V2);
	},
	Geq:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return OperatorStates.geq(State,V1,V2);
	},
	Neq:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1")),
			V2 = await this.Parse(State,Token.Read("V2"));
		return OperatorStates.neq(State,V1,V2);
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
		    Call = await OperatorStates.index(State,Obj,Index);
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
		if(Expression){
			let NewState = new EpoxyState(Body,State);
			await this.ParseState(NewState);
		}else{
			for(let Condition of Conditions){
				if(Condition.Type === "ElseIf"){
					let Exp = await this.Parse(State,Condition.Read("Expression")),
					    Bd = Condition.Read("Body");
					if(Exp){
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
		while(await this.Parse(State,Expression)){
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
		while(await this.Parse(ProxyState,Expression)){
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
		return await OperatorStates.index(State,Obj,Index);
	},
	Length:async function(State,Token){
		let V1 = await this.Parse(State,Token.Read("V1"));
		return await OperatorStates.len(State,V1);
	},
	/*
	*/
}

/*************************\
          Exports
\*************************/

export {InterpreterStates,OperatorStates,AssignmentStates};
