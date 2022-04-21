/*************************\
          Imports
\*************************/

/*************************\
      Internal Classes
\*************************/

class Thread {
	constructor(Stack,State){
		let Hidden = {
			State:State,
			Resolve:undefined,
			Yield:false,
		};
		this.GetState = function(Stk,St){
			if(Stk===Stack&&St===State)return null;
			return Hidden.State;
		}
		this.GetResolve = function(Stk,St){
			if(Stk===Stack&&St===State)return null;
			return Hidden.Resolve;
		}
		this.WriteResolve = function(Stk,St){
			if(Hidden.Yield===true)return null;
			if(Stk===Stack&&St===State)return null;
			Hidden.Resolve=Stk;
		}
		this.Yield = function(Stk,St){
			if(Hidden.Yield===true)return null;
			if(Stk===Stack&&St===State)return null;
			Hidden.Yield=true;
			return true;
		}
		this.Resume = function(Stk,St,...Arguments){
			if(!Hidden.Yield)return null;
			if(Stk===Stack&&St===State)return null;
			Hidden.Yield=false;
			Hidden.Resolve(...[Stk,St,...Arguments]);
		}
		this.running = function(Stk,St){
			return !Hidden.Yield;
		}
	}
	toString(){
		return "thread"	
	}
}

/*************************\
          Library
\*************************/

const Library = {
	//{{ Functions }}\\
	log:function(Stack,State,...a){
		console.log(...a);
	},
    warn:function(Stack,State,...a){
    	console.warn(...a);
    },
    error:function(Stack,State,...a){
		console.err(...a);
    	throw Error(...a);
    },
    wait:async function(Stack,State,Time=1){
    	return await new Promise(r=>setTimeout(r,Time*1000))
    },
    type:function(Stack,State,x){
    	let t=typeof x;
        if(t==="object"&&x instanceof Array)return"array";
        if(x===null||x===undefined)return"null";
        return t;
    },
    time:(Stack,State)=>Date.now()/1000,
    getenv:function(Stack,State,Up=0){
    	let SearchState = State,AccessPoint = "__CACHED_ENV";
    	while(Up>0){
        	let Upper = SearchState.Parent;
            if(!Upper)break;
            SearchState = Upper;
        	Up--;
        }
        if(!SearchState)return {};
        if(SearchState[AccessPoint])return SearchState[AccessPoint];
        let Access = new Proxy({},{
        	get:function(self,Name){
            	return SearchState.GetVariable(Name);
            },
            set:function(self,Name,Value){
            	SearchState.SetVariable(Name,Value);
            	return Value;
            }
        });
        SearchState[AccessPoint]=Access;
        return Access;
    },
    async:(Stack,State,c,...a)=>{
    	setTimeout(()=>c(Stack,State,...a),0);
    },
    tostring:(Stack,State,a)=>String(a),
    tofloat:(Stack,State,a)=>parseFloat(a),
    toint:(Stack,State,a)=>parseInt(a),
    //{{ Libraries }}\\
    string:{
    	split:function(Stack,State,a,b){
        	return a.split(b||"");
        },
        repeat:function(Stack,State,a,b){
        	return a.repeat(b);
        },
        starts:function(Stack,State,a,b){
        	return a.startsWith(b);
        },
        ends:function(Stack,State,a,b){
        	return a.endsWith(b);
        },
        sub:function(Stack,State,a,b,c){
        	return a.substring(b,c);
        },
        subs:function(Stack,State,a,b,c){
        	return a.substr(b,c);
        },
        match:function(Stack,State,a,b){
        	return a.match(b);
        },
        reverse:function(Stack,State,a,b){
        	return a.split("").reverse().join("");
        },
        lower:function(Stack,State,a){
        	return a.toLowerCase();
        },
        upper:function(Stack,State,a){
        	return a.toUpperCase();
        },
        char:function(Stack,State,a){
        	return a.charCodeAt(0);
        },
        byte:function(Stack,State,a){
        	return String.fromCharCode(a);
        },
    },
    array:{
    	has:function(Stack,State,a,b){
        	return a.includes(b);
        },
        find:function(Stack,State,a,b){
        	return a.indexOf(b);
        },
        reverse:function(Stack,State,a){
        	return a.reverse();
        },
        join:function(Stack,State,a,b){
        	return a.join(b||"");
        },
        append:function(Stack,State,a,b){
        	return a.push(b);
        },
        prepend:function(Stack,State,a,b){
        	return a.unshift(b);
        },
        remove:function(Stack,State,a,b){
        	return a.splice(b,1);
        },
        pop:function(Stack,State,a){
        	return a.pop();
        },
        prepop:function(Stack,State,a){
        	return a.shift();
        },
        each:function(Stack,State,a,c){
        	for(let k in a)c(a[k],k,a);
        },
    },
    bit:{
    	and:(sk,st,a,b)=>a&b,
        or:(sk,st,a,b)=>a|b,
        xor:(sk,st,a,b)=>a^b,
        not:(sk,st,a)=>~a,
       	rshift:(sk,st,a,b)=>a>>b,
        lshift:(sk,st,a,b)=>a<<b,
    },
	thread:{
		get:async function(Stack,State){
			let T = State.GlobalRead("Thread");
			if(!T){
				T = new Thread(Stack,State);
				State.Write("Thread",T);
			}
			return T;
		},
		yield:async function(Stack,State,T){
			if(!(T instanceof Thread))return null;
			return await new Promise(r=>{
				T.WriteResolve(r);
				let R=T.Yield();
				if(R===null)return r();
			}).then(x=>x);
		},
		resume:async function(Stack,State,T,...Arguments){
			if(!(T instanceof Thread))return null;
			await T.Resume(...Arguments);
		},
	},
};

Library.env = Library;

/*************************\
          Exports
\*************************/

export {Library};
