/*************************\
          Imports
\*************************/
 
import {ErrorHandler} from "https://fireyauto.github.io/Epoxy/src/errorhandling.js";
import {Tokens as _Tokens} from "https://fireyauto.github.io/Epoxy/src/tokens.js";
import {ASTBase,ASTNode,ASTBlock} from "https://fireyauto.github.io/Epoxy/src/astclasses.js";

/*************************\
          Chunks
\*************************/

const Chunks = [
	{
		Name:"VAR",
		Type:"Keyword",
		Call:function(){
			let Node = this.NewNode("NewVariable");
			Node.Write("Variables",this.IdentifierList({
				AllowDefault:true,
				Priority:-1,
				EType:"variable expression",
			}));
			return Node;
		},
	},
	/*
	{
		Name:"Name",
		Type:"Type",
		Call:function(){
			let Node = this.NewNode("Type");
			
			return Node;
		},
	},
	*/
];

/*************************\
        Expressions
\*************************/

const Expressions = [
	{
		Type:"Constant",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			return this.ASTExpression(this.Token.Literal,Priority);
		},
	},
	/*
	{
		Name:"Name",
		Type:"Type",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			let Node = this.NewNode("Type");
			
			return this.ASTExpression(Node,Priority);
		},
	},
	*/
];

/*************************\
    Complex Expressions
\*************************/

const ComplexExpressions = [
	/*
	{
		Name:"Name",
		Type:"Type",
		Stop:false,
		Priority:0,
		Call:function(Value,Priority,AllowList,Type){
			let Node = this.NewNode("Type");
			
			return this.ASTExpression(Node,Priority);
		},
	},
	*/
];

/*************************\
          Exports
\*************************/

export {Chunks,Expressions,ComplexExpressions};
