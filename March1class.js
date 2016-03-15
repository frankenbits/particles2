var particleSystem = []; //array of particles
var attractors = []; //array of attractors
var table;
var aggregated = {}; //the object used to store companies and sums of amounts
//var categoryObject = [];

function preload(){
  table = loadTable("data/investments.csv", "csv", "header");
  tableCategories = loadTable("data/companies_categories.csv", "csv", "header");
  
  roboto = loadFont("Fonts/Roboto-Regular.ttf");
  robotoBold = loadFont("Fonts/Roboto-Bold.ttf");
}

function setup() {
    var canvas = createCanvas(windowWidth,windowHeight);
    frameRate(30);
    
    colorMode(HSB, 360, 100, 100, 100);
    background(0);
    
    /*textFont(robotoBold);
    textSize(24);
    text("Cara Frankowicz", 10, 10);
    fill(352, 34, 26);*/
    
    var at = new Attractor(createVector(width/2, height/2), 1);
    attractors.push(at);
    
    print(table.getRowCount() + "total rows in table");
    
    //aggregates companies into the object aggregated
    for (var r = 0; r < table.getRowCount(); r++){
        var cname = table.getString(r, "company_name");
        //var iname = table.getString(r, "investor_name");
        var invested = table.getString(r, "amount_usd"); 
        invested = parseInt(invested);
        if(!isNaN(invested)){                           
            if(aggregated.hasOwnProperty(cname)){       
                aggregated[cname]=aggregated[cname]+invested;        
            }else{
                aggregated[cname] = invested;         
            }
         }
        //AggregatedInvestors[iname] = "gibberish";
    }

    //lets put the object into an array
    var aAggregated = [];
    
    /*converts the aggregated object into an array of objects {name : name_, sum : sum_}*/
    Object.keys(aggregated).forEach(function(name_){   
        var company = {};
        company.name = name_;
        company.sum = aggregated[name_]
        aAggregated.push(company);
    });
    
    aAggregated = aAggregated.sort(function(companyA, companyB){
    return companyB.sum - companyA.sum;
    });
    
    aAggregated = aAggregated.slice(0,200);
    
    //prints the top company
    print(aAggregated[0].name_ + " : " +aAggregated[0].sum);

    //creates object with category name 
    var categoryObject = {};
    for (var r = 0; r < tableCategories.getRowCount(); r++){
        //var companyName = tableCategories.getString(r, "name");
        var categoryName = tableCategories.getString(r, "category_code");
        if(categoryObject.hasOwnProperty(categoryName)){
            categoryObject[categoryName]++;
        }else{
            categoryObject[categoryName] = 1;
        }
        
    }
    
    //treat object like its an array
    Object.keys(categoryObject).forEach(function(categoryName){
        print(categoryName + " " + categoryObject[categoryName]);
    });
    
    for(var i=0; i<aAggregated.length; i++){
        var p = new Particle(aAggregated[i].name, aAggregated[i].sum);
        particleSystem.push(p);
    }  
    
    
    //go through table - does company exist in aAggregated array
    for (var r = 0; r < table.getRowCount(); r++){
        //store company name from table
        var cname = table.getString(r, "company_name");
        var iname = table.getString(r, "investor_name");
        var invested = table.getString(r, "amount_usd"); 
        
        var foundCompany = aAggregated.find(function(element, index, array){
            if(element.name == cname)return true;
            else return false;
        });
    
    }
            
}
    
    
function getCompanyParticle(company){
    for(var i=0; i< particleSystem.length; i++){
        if(particleSystem[i].name == company.name){
            return particleSystem[i];
        } 
    }
}

    
function draw(){
    background(33, 6, 91, 60);
    //blendMode(SCREEN);
        for(var STEPS = 0; STEPS<3; STEPS++){
            //make a collision
            for(var i=0; i<particleSystem.length-1; i++){
                for(var j=i+1; j<particleSystem.length; j++){
                    var pa = particleSystem[i];
                    var pb = particleSystem[j];
                    var ab = p5.Vector.sub(pb.pos, pa.pos);
                    var distSq = ab.magSq();
                    if(distSq <= sq(pa.radius + pb.radius)){
                        var dist = sqrt(distSq);
                        var overlap = (pa.radius + pb.radius) - dist;
                        ab.div(dist); 
                        ab.mult(overlap*0.4);
                        pb.pos.add(ab);
                        ab.mult(-1);
                        pa.pos.add(ab);
                        
                        //dump the velocity (make it lose traction when there is a collision)
                        //each time particles collide it multiplies the velocity by 97%
                        //much easier on system (less computing) than limit(); function
                        pa.vel.mult(0.97);
                        pb.vel.mult(0.97);
                    }
                }
            }
        }
    
    for (var i=particleSystem.length-1; i>=0; i--){
         var p = particleSystem[i];
        p.update();
        p.draw();      
        
    }
    
    attractors.forEach(function(at){
        at.draw();
    
    });
    
 }
    
  

function windowResized(){
    resizeCanvas(windowWidth, windowHeight);

}

var Particle = function(name, sum){
    this.name = name;
    this.sum = sum/1000000000;
    
    this.radius = sqrt(sum)/3000; //change size of particles
    var initialRadius = this.radius;
    var maximumRadius = 80;
    
    var tempAng = random(TWO_PI);
    this.pos = createVector(cos(tempAng), sin(tempAng));
    this.pos.div(this.radius);
    this.pos.mult(2000);//how close together the particles are
    this.pos.set(this.pos.x + width/2, this.pos.y + height/2);
    
    this.vel = createVector(0, 0);
    var acc = createVector(0, 0);
    
    //this.hue = 100
    //this.hue = random(100, 300);
    var psizesq = this.psize * this.psize;
    
    var isMouseOver = false;
    
    
    this.color = {h:0, s:0, b:0};
    
    
    //here is where i should tell the particle to find its category from the second table. 
    this.category = "other";
    for(var i=0; i<tableCategories.getRowCount(); i++){
        var companyName = tableCategories.getString(i, "name");
        if(companyName == this.name){
            var catCode = tableCategories.getString(i, "category_code");
            this.category = catCode;
        }
        
    }
    
    switch(this.category){
        case "software":
            this.color = {h:229, s:100, b:59, a:60};    //blue
            break;
            
        case "web":
            this.color = {h:33, s:100, b:93, a:60};     //orangeish
            break;
            
        case "biotech":
            this.color = {h:302, s:70, b:60, a:60};    //purple
            break;
            
        case "mobile":
            this.color = {h:109, s:100, b:70, a:60};    //green
            break;
            
        case "enterprise":
            this.color = {h:342, s:100, b:93, a:50};    //pink
            break;
            
        case "ecommerce":
            this.color = {h:58, s:100, b:85, a:80};    //yellow
            break;
            
        default:
            this.color = {h:180, s:100, b:70, a:40};    //green-blue
    };
    
    
    this.update = function(){
        checkMouse(this);
        attractors.forEach(function(A){
            var att = p5.Vector.sub(A.pos, this.pos);
            var distanceSq = att.magSq();
            if(distanceSq > 1){
                att.normalize();
                att.div(10);
                //att.mult(2);
                //att.mult(A.getStrength());
                acc.add(att);            
            }
            
        }, this);
        
        this.vel.add(acc);
        this.pos.add(this.vel);
        acc.mult(0);
    
    }  
    
    this.draw = function(){
        noStroke();
        textFont(roboto);
        textSize(14);
        fill(this.color.h, this.color.s, this.color.b, this.color.a);
        
        ellipse(this.pos.x, 
                this.pos.y,
                this.radius*2,
                this.radius*2);
        
        if(isMouseOver){
            textAlign(CENTER);
            fill(0 , 0, 100);
            
            sum = this.sum*1000
            rectMode(CENTER);
            
            if (this.sum > 1){
                text(this.name + "\n\n$" + this.sum.toFixed(1).replace(/(\d)(?=(\d{3})+$)/g, "$1,") + " billion",  this.pos.x, this.pos.y, this.radius, this.radius);
            } else {
                if (this.name.length > 20 ) {
                        text(this.name + "\n$" + sum.toFixed(0).replace(/(\d)(?=(\d{3})+$)/g, "$1,") + " million",  this.pos.x, this.pos.y, this.radius, this.radius);
                    } else {
                        text(this.name + "\n\n$" + sum.toFixed(0).replace(/(\d)(?=(\d{3})+$)/g, "$1,") + " million",  this.pos.x, this.pos.y, this.radius, this.radius);
                    }  
                }          
            }
        
        else{
            fill(180, 100, 70, 40); 
        }
    
    }
    //check if mouse is over the particle
    function checkMouse(instance){
        var mousePos = createVector(mouseX, mouseY);
        if(mousePos.dist(instance.pos)<= instance.radius){
            incRadius(instance);
            isMouseOver = true;
        }else{
            decRadius(instance);
            isMouseOver = false;
        }
    }   
    //increase particle size
    function incRadius(instance){
        instance.radius+=4;
        if(instance.radius > maximumRadius){
            instance.radius = maximumRadius;
        }
    }
    //decrease particle size
    function decRadius(instance){
        instance.radius-=4;
        if(instance.radius < initialRadius){
            instance.radius = initialRadius;
        }
    }
    
}
                     
                     
//create attractor
var Attractor = function(pos, s){
    this.pos = pos.copy();
    var strength = s;
    var transparency = 0;
    
    this.draw = function(){
        noStroke();
        fill(0, 0, 0, transparency);
        ellipse(this.pos.x, this.pos.y,
                strength, strength);
    }
    
    this.getStrength = function(){
        return strength;
    }
    this.getPos = function(){
        return this.pos.copy();
    }
}  