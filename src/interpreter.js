/*************************\
		  Imports
\*************************/

import {EpoxyState} from "https://fireyauto.github.io/Epoxy/src/interpreterstate.js";
import {InterpreterStates} from "https://fireyauto.github.io/Epoxy/src/interpreterparsestates.js";
import {ASTBase,ASTNode,ASTBlock} from "https://fireyauto.github.io/Epoxy/src/astclasses.js";

/*************************\
    Default Environment
\*************************/

const DefaultEnvironment = {
	"_version":"Epoxy 1.0",
};

/*************************\
        Interpreter
\*************************/

const Interpreter = {
	New:function(ASTStack,Environment={}){
		return new IntepreterStack(ASTStack,Environment);
	},
	GetType:function(Value){
		let Type=typeof Value;
		if(Value instanceof Array)return"array";
		if(Value===null||Value===undefined)return"null";
		return Type;
	}
}

/*************************\
     Interpreter Stack
\*************************/

class UnpackState {
	constructor(List){
		this.List=List;
	}
}

class InterpreterStack {
	constructor(ASTStack,Environment){
		this.AStack=ASTStack,
			this.Tokens=ASTStack.Result,
			this.MainState=new EpoxyState(this.Tokens),
			this.Environment=Environment;
		for(let Name in DefaultEnvironment)
			if(!Object.prototype.hasOwnProperty.call(Environment,Name))
				Environment[Name]=DefaultEnvironment[Name];
		for(let Name in Environment)this.MainState.NewVariable(Name,Environment[Name]);
		this.States = {};
		for(let Name in InterpreterStates)this.States[Name]=InterpreterStates[Name].bind(this);
	}
	UnpackState(...Arguments){
		return new UnpackState(...Arguments);
	}
	async Parse(State,Token,Unpack=false){
		if(!(Token instanceof ASTBase))return Token;
		for(let Name in this.States){
			let Call = this.States[Name];
			if(Token.Type===Name)return await Call(State,Token);
			else if(Token.Type==="Unpack"){
				if(Unpack===true){
					let List=await this.Parse(State,Token.Read("List"),true);
					return new UnpackState(List);
				}else ErrorHandler.IntepreterError(Token,"Unexpected",["unpacking operator"]);
			}
		}
	}
	async ParseState(State,Unpack=false,Proxy){
		let S1=State,
			S2=State;
		if(Proxy)S1=Proxy;
		while(!S1.IsEnd()){
			let Result=await this.Parse(S2,S1.Token,Unpack);
			S1.Next();
			if(S2.Read("Returned")===true){
				S2.Write("InLoop",false);
				break;
			}
			if(S2.Read("Break")===true){
				S2.Write("InLoop",false);
				break;
			}
			if(S2.Read("Continue")===true)break;
		}
		S1.Close();
	}
	async ParseArray(State,List){
		let Result=[];
		for(let k in List){
			let v=List[k],r=undefined;
			if(typeof v==="object"&&!(v instanceof ASTBase))r=await this.ParseArray(State,v);
			else r=await this.Parse(State,v,true);
			if(r instanceof UnpackState)for(let x of r.List)Result.push(x);
			else Result.push(r);
		}
		return Result;
	}
}

/*************************\
          Exports
\*************************/

export {Interpreter,InterpreterStack};
