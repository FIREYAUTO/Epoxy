# Epoxy
The Epoxy Programming Language
***
# What is Epoxy?
Epoxy is a interpreted, high-level, structured, dynamically typed programming language written in JavaScript which has a similar syntax design to lua; it has very simplistic syntax, and was designed to take a step away from c-style & js-style languages.

Epoxy is the first language created by FIREYAUTO to have a fully sandboxed environment from its parent language due to the nature of how the closures in the language work. This means that only functions specifically designed for the language will work, and there is a barrier from parent operations to the language operations to follow its own set of rules for logical operations and more.

Epoxy is considerably slow in the grand scheme of a programming language, but this is mainly due to the abstraction to make Epoxy easier to develop and maintain. In the future there may be tests to design compilers which could enhance the performance of Epoxy.

# Reserved Keywords
The tokens listed below are reserved keywords which cannot be used as variable names. 

```
var, fn, while, do, cls, loop, iter, of, as, in, true, false, null, return, dvar, if, elseif, else, break, continue, then
```
***
# Syntax Overview

## Prerequisites
* You are expected to already know at least one programming language with a similar style to lua or javascript, otherwise the overview below will probably not make much sense.
* Definition Keys:
> `<Expression>`: An expression is anything ranging from identifiers to constants to anonymous functions to basic datatypes<br>
> `<Variable Name>`: An identifier which is not from the reserved keywords list listed above<br>
> `,...`: The previous definition can be repeated using a comma<br>
> `<Code>`: Any chunk of code<br>
> `<Variable Declaration>`: Variable declarations without using the `var` or `dvar` keywords<br>
> `<Condition>`: A determining expression which allows for loops or other things to run<br>
> `<Parameter>`: An identifier for function parameters<br>
> `<Variable>`: A conglomerate of variables or indexes<br>
> `<Text>`: A string of characters<br>
> `<Function Declaration>`: A basic function declaration<br>

***
## If Statements

```
if <Condition> then
	<Code>
elseif <Condition> then
	<Code>
else
	<Code>
cls
```
***
## Loops

### Loop

```
loop <Variable Declaration>;<Condition>;<Variable Increment> do
	<Code>
cls
```

### Iterate

```
iter <Variable Name>,... <as|in|of|> <Expression> do
	<Code>
cls
```

### While

```
while <Condition> do
	<Code>
cls
```
***
## Variables

```
--Declaring Basic Variables
var <Variable Name>: <Expression>,
	...
--Declaring Destructuring Variables
dvar <Variable Name>,...: <Expression>,...

--Updating Basic Variables

<Variable Name>: <Expression>

--Updating Multiple Variables

<Variable Name>,...: <Expression>,...
```

## Functions

```
fn <Variable Name>(<Parameter>: <Expression>,...)
	<Code>
cls
```
***
## Stack Controlling

### Return

```
return <Expression>,...
```

### Break & Continue

```
break

continue
```
***
## Operators

### Math Operators

```
<Expression> + <Expression> --Add
<Expression> - <Expression> --Subtract
<Expression> * <Expression> --Multiply
<Expression> / <Expression> --Divide
<Expression> % <Expression> --Modulus
<Expression> ^ <Expression> --Exponent
- <Expression> --Negative
```

### Logical Operators

```
<Expression> && <Expression> --And
<Expression> || <Expression> --Or
! <Expression> --Not
```

### Comparison Operators

```
<Expression> == <Expression> --Equals
<Expression> > <Expression> --Greater Than
<Expression> >= <Expression> --Greater Than or Equal to
<Expression> < <Expression> --Less Than
<Expression> <= <Expression> --Less Than or Equal to
<Expression> != <Expression> --Not Equal to
```

### Assignment Operators

```
<Variable> : <Expression>
<Variable> +: <Expression>
<Variable> -: <Expression>
<Variable> *: <Expression>
<Variable> /: <Expression>
<Variable> %: <Expression>
<Variable> ^: <Expression>
```

### Other Operators

```
# <Expression> --Length Operator
```

### Indexing Operators

```
<Expression>.<Identifier>: <Expression>
<Expression>[<Expression>]: <Expression>
```
***
## Data Types

### Strings

```
"<Text>"
'<Text>'
```

### Booleans

```
true, false, null
```

### Numbers

```
1, 1.2, 1.2e3, 1e3, 1.2e-3, 1e-2
```

### Arrays

```
[<Expression>,...]
```

### Objects

```
{ <Identifier>: <Expression> }
{ [<Expression>]: <Expression> }
{ <Variable Name> }
{ <Function Declaration> }
```
***
## Calling

### Basic Calling

```
<Expression>(<Expression>,...)
```

### Self Calling

```
<Expression> >> <Identifier>(<Expression>,...)
```
***
## Comments

```
-- Text

--[[
Text
--]]
```
