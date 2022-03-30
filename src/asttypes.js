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
			this.Next();
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
	{
		Name:"SUB",
		Type:"Operator",
		Stop:false,
		Priority:300,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Sub");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"ADD",
		Type:"Operator",
		Stop:false,
		Priority:320,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Add");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"MUL",
		Type:"Operator",
		Stop:false,
		Priority:360,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Mul");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"DIV",
		Type:"Operator",
		Stop:false,
		Priority:340,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("DIV");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"MOD",
		Type:"Operator",
		Stop:false,
		Priority:340,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Mod");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"POW",
		Type:"Operator",
		Stop:false,
		Priority:380,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("Pow");
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
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
