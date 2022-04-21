/*************************\
     Epoxy State Data
\*************************/

const StatePropagation = {
	OnWrite:[
		{
			Names:["Returned","Returns"],
			Check:(c,p)=>c.Read("IsFunction")!=true,
		},
		{
			Names:["Break","Continue"],
			Check:(c,p)=>c.Read("IsLoop")!=true,
		},
		{
			Names:["Thread"],
			Check:(c,p)=>c.Read("IsFunction")!=true,
		},
	],
	OnGlobalRead:[
		{
			Names:["Thread"],
			Check:(c,p)=>c.Read("IsFunction")!=true,
		},
	],
}

/*************************\
        Epoxy State
\*************************/

class EpoxyState {
	constructor(Body,Parent,Extra={}){
		this.Token=Body.Data[0],
			this.Tokens=Body,
			this.Parent=Parent,
			this.Data={
				IsFunction:false,
				IsLoop:false,
				Returns:undefined,
				Returned:false,
				Break:false,
				Continue:false,
			},
			this.Variables=[],
			this.Children=[],
			this.Position=0,
			this.Line=0,
			this.Index=0;
		for(let Name in Extra)this.Data[Name]=Extra[Name];
		if(Parent&&Parent instanceof EpoxyState)Parent.Children.push(this);
		if(this.Token)this.Line=this.Token.Line,this.Index=this.Token.Index;
		else if(this.Parent&&this.Parent.Token)this.Line=this.Parent.Token.Line,this.Index=this.Parent.Token.Index;
	}
	Write(Name,Value){
		this.Data[Name]=Value;
		if(this.Parent)
			for(let Property of StatePropagation.OnWrite){
				let {Names,Check}=Property;
				if(Names.includes(Name)&&Check(this,this.Parent))this.Parent.Write(Name,Value);
			}
	}
	Read(Name){
		return this.Data[Name];	
	}
	GlobalRead(Name){
		let Value = this.Read(Name);
		if(Value===undefined&&this.Parent){
			for(let Property of StatePropagation.OnGlobalRead){
				let {Names,Check}=Property;
				if(Names.includes(Name)&&Check(this,this.Parent)){
					Value = this.Parent.GlobalRead(Name);
					break;
				}
			}
		}
		return Value;
	}
	Next(Amount=1){
		this.Position+=Amount;
		this.Token=this.Tokens.Data[this.Position];
		if(this.Token)this.Index=this.Token.Index,this.Line=this.Token.Line;
		return this.Token
	}
	IsEnd(){
		return this.Position >= this.Tokens.Data.length;	
	}
	Close(){
		if(this.Parent)this.Parent.Children.splice(this.Parent.Children.indexOf(this),1);
		let Variables=this.GetGlobalVariables();
		for(let Child of this.Children){
			for(let Variable of Variables)Child.TransferVariable(Variable);
			Child.Parent=undefined;
		}
		this.Variables=[];
	}
	TransferVariable(Variable){
		if(!this.IsVariable(Variable.Name))this.Variables.push(Variable);	
	}
	GetGlobalVariables(){
		let Variables=[],
			Search=this;
		while(Search){
			for(let Variable of Search.Variables)Variables.push(Variable);
			Search=Search.Parent;
		}
		return Variables;
	}
	GetRawVariable(Name){
		for(let Variable of this.Variables)if(Variable.Name===Name)return Variable;
	}
	IsVariable(Name){
		return !!this.GetRawVariable(Name);	
	}
	VariablePrototype(Name,Value){
		return {
			Name:Name,
			Value:Value,
		};
	}
	GetGlobalRawVariable(Name){
		let Variable = this.GetRawVariable(Name);
		if(!Variable&&this.Parent)
			Variable=this.Parent.GetGlobalRawVariable(Name);
		return Variable;
	}
	GetVariable(Name){
		if(this.IsVariable(Name))return this.GetRawVariable(Name).Value;
		else if(this.Parent)return this.Parent.GetVariable(Name);
		return null;
	}
	SetVariable(Name,Value){
		if(this.IsVariable(Name)){
			let Variable=this.GetRawVariable(Name);
			Variable.Value=Value;
		}else if(this.Parent)this.Parent.SetVariable(Name,Value);
		else this.NewVariable(Name,Value);
	}
	NewVariable(Name,Value,Extra={}){
		let Variable=this.VariablePrototype(Name,Value);
		for(let Name in Extra)Variable[Name]=Extra[Name];
		if(this.IsVariable(Name))this.DeleteVariable(Name,true);
		this.Variables.push(Variable);
	}
	DeleteVariable(Name,Local=false){
		if(this.IsVariable(Name))
			for(let Key in this.Variables){
				Key=+Key;
				let Variable=this.Variables[Key];
				if(Variable.Name===Name){
					this.Variables.splice(Key,1);
					break;
				}
			}
		else if(this.Parent&&!Local)this.Parent.DeleteVariable(Name);
	}
}

/*************************\
          Exports
\*************************/

export {EpoxyState};
