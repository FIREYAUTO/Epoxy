/*************************\
         Imports
\*************************/

import {ErrorHandler} from "https://fireyauto.github.io/Epoxy/src/errorhandling.js";

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
					State.SetVariable(Name,Call(State,Variable.Value,Value));
					return Variable.Value;
				}else{
					let Result=Call(State,null,Value);
					State.SetVariable(Name,Result);
					return Result;
				}
			}else if(Name.Type==="GetIndex"){
				let Obj = await this.Parse(State,Name.Read("Object")),
					Index = await this.Parse(State,Name.Read("Index")),
					ObjIndex = OperatorStates.index(State,Obj,Index);
				let Result = Call(State,ObjIndex,Value);
				OperatorStates.setIndex(Obj,Index,Result);
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
	Call:async function(State,Token){
		let Call = await this.Parse(State,Token.Read("Call")),
			Arguments = await this.ParseArray(State,Token.Read("Arguments"));
	},
	/*
	Call: function (State, Token) {
				let Call = this.Parse(State, Token.Read("Call"));
				let Arguments = this.ParseArray(State, Token.Read("Arguments"));
				let M = this.GetAdvancedMethod(State,Call,"call");
				if(M&&typeof M==="function")return this.DoCall(State,Call,Arguments);
				if (!(Call instanceof Function)) {
					ErrorHandler.IError(Token, "Attempt", "call non-function");
				}
				return this.DoCall(State,Call,Arguments);
			},
			SelfCall: function (State, Token) {
				let O = this.Parse(State, Token.Read("Object"));
				let I = this.Parse(State, Token.Read("Index"));
				let Obj = O;
				let Pr = false;
				if (State.Read("IsClass") === true && State.Read("Classes").includes(O)) {
					let Private = State.Read("Private");
					if (Private.hasOwnProperty(I)) {
						O = Private;
						Pr = true;
					}
				}
				let Arguments = this.ParseArray(State, Token.Read("Arguments"));
				let Call = O[I];
				let M = this.GetAdvancedMethod(State,O,"index");
				if(M&&typeof M==="function"&&!Pr)Call=this.DoCall(State,M,[Obj,I]);
				if (!(Call instanceof Function)) {
					ErrorHandler.IError(Token, "Attempt", "call non-function");
				}
				Arguments.unshift(Obj);
				return this.DoCall(State,Call,Arguments);
			},
	*/
}

/*************************\
          Exports
\*************************/

export {InterpreterStates,OperatorStates,AssignmentStates};
