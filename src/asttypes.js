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
	{
		Type:"Identifier",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			let Node = this.NewNode("GetVariable");
			Node.Write("Name",this.Token.Literal);
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Value:"POPEN",
		Type:"Bracket",
		Stop:false,
		Call:function(Priority,AllowList,Type){
			this.Next(2);
			let Node = this.ParseExpression(-1);
			this.TestNext("PCLOSE","Bracket");
			return this.ASTExpression(Node,Priority);
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
			if(this.Check("COLON","Operator")){
				if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"||Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected","identifier or index for assignment");
				Node.Type = "Assignment";
				this.Next();
				Node.Write("Type",2);
				Node.Write("Name",Value);
				Node.Write("Value",this.ParseExpression());
				return this.ASTExpression(Node,Priority);
			}
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
			if(this.Check("COLON","Operator")){
				if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"||Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected","identifier or index for assignment");
				Node.Type = "Assignment";
				this.Next();
				Node.Write("Type",1);
				Node.Write("Name",Value);
				Node.Write("Value",this.ParseExpression());
				return this.ASTExpression(Node,Priority);
			}
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
			if(this.Check("COLON","Operator")){
				if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"||Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected","identifier or index for assignment");
				Node.Type = "Assignment";
				this.Next();
				Node.Write("Type",3);
				Node.Write("Name",Value);
				Node.Write("Value",this.ParseExpression());
				return this.ASTExpression(Node,Priority);
			}
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
			let Node = this.NewNode("Div");
			if(this.Check("COLON","Operator")){
				if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"||Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected","identifier or index for assignment");
				Node.Type = "Assignment";
				this.Next();
				Node.Write("Type",4);
				Node.Write("Name",Value);
				Node.Write("Value",this.ParseExpression());
				return this.ASTExpression(Node,Priority);
			}
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
			if(this.Check("COLON","Operator")){
				if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"||Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected","identifier or index for assignment");
				Node.Type = "Assignment";
				this.Next();
				Node.Write("Type",5);
				Node.Write("Name",Value);
				Node.Write("Value",this.ParseExpression());
				return this.ASTExpression(Node,Priority);
			}
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
			if(this.Check("COLON","Operator")){
				if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"||Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected","identifier or index for assignment");
				Node.Type = "Assignment";
				this.Next();
				Node.Write("Type",6);
				Node.Write("Name",Value);
				Node.Write("Value",this.ParseExpression());
				return this.ASTExpression(Node,Priority);
			}
			Node.Write("V1",Value);
			Node.Write("V2",this.ParseExpression(Priority));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"IOPEN",
		Type:"Bracket",
		Stop:false,
		Priority:700,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("GetIndex");
			Node.Write("Object",Value);
			Node.Write("Index",this.ParseExpression(-1));
			this.TestNext("ICLOSE","Bracket");
			this.Next();
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"DOT",
		Type:"Operator",
		Stop:false,
		Priority:700,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("GetIndex");
			Node.Write("Object",Value);
			let Token = this.Token;
			if(!Token.is("Identifier")&&!Token.is("Keyword"))ErrorHandler.ASTError(this,"ExpectedGot","identifier for index name",this.GetFT({UseType:true,UseLiteral:true,Token:Token}));
			Node.Write("Index",Token.Literal);
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"COLON",
		Type:"Operator",
		Stop:false,
		Priority:50,
		Call:function(Value,Priority,AllowList,Type){
			if(!(Value instanceof ASTBase)||(Value.Type!="GetVariable"&&Value.Type!="GetIndex"))ErrorHandler.ASTError(this,"Expected","identifier or index for assignment");
			let Node = this.NewNode("Assignment");
			Node.Write("Type",0);
			Node.Write("Name",Value);
			Node.Write("Value",this.ParseExpression());
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"POPEN",
		Type:"Bracket",
		Stop:false,
		Priority:1000,
		Call:function(Value,Priority,AllowList,Type){
			this.Next();
			let Node = this.NewNode("Call");
			Node.Write("Call",Value);
			Node.Write("Arguments",this.ExpressionListInside({Name:"POPEN",Type:"Bracket"},{Name:"PCLOSE",Type:"Bracket"}));
			return this.ASTExpression(Node,Priority);
		},
	},
	{
		Name:"SELFCALL",
		Type:"Operator",
		Stop:false,
		Priority:900,
		Call:function(Value,Priority,AllowList,Type){
			this.Next(2);
			let Node = this.NewNode("SelfCall");
			Node.Write("Object",Value);
			this.ErrorIfEOS();
			let Token = this.Token;
			if(!Token.isType("Identifier")&&!Token.isType("Keyword"))ErrorHandler.ASTError(this,"ExpectedGot","identifier for index name",this.GetFT({UseType:true,UseLiteral:true,Token:Token}));
			Node.Write("Index",Token.Literal);
			this.TestNext("POPEN","Bracket");
			this.Next();
			Node.Write("Arguments",this.ExpressionListInside({Name:"POPEN",Type:"Bracket"},{Name:"PCLOSE",Type:"Bracket"}));
			return this.ASTExpression(Node,Priority);
		},
	},
	/*
	
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
