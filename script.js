// Define width, height and margin
const width = 700,height = 700;
const margin = {top:20,right:20,bottom:20,left:40};
let groupYear = {}, sign = 1,flag = 1.5;
//Initialize and append svg to body
let svg = d3.select('#root')
		.append('svg')
		.attr('width',width)
		.attr('height',height)
		.style('margin-left','20px');

//Function to check for overlaps
let isOverlapping = function(a,b){
	return !((a.x + a.width < b.x) || (a.x > b.x + b.width) || (a.y + a.height < b.y) || (a.y > b.y + b.height));
}
//Read csv file and proceed inside callback
d3.csv('https://docs.google.com/spreadsheets/d/e/2PACX-1vS5yUdlq9arfBZ-VhwnvtuxySSonrPDZ1iiY_JwD6X94UIU9Di9BIV63WWVf9DEd-JkDOqCXqtNvqYn/pub?gid=2121555861&single=true&output=csv',(data) => {
	//Sort the csv rows by years and then by %gap
	data.sort(function(a,b){
		if (a['Year'] === b['Year']){
			return a['% gap'] - b['% gap'];
		}else{
			return a['Year'] - b['Year'];
		}
	});
	//Define scale for x axis
	let xExtent = d3.extent(data,d => +d['% gap']);
	let xScale = d3.scaleLinear()
		.domain([xExtent[0] - 3,xExtent[1] + 3]) //input
		.range([margin.left,width - margin.right]); //output

	//Define scale for y axis
	let yExtent = d3.extent(data,d => +d['Year']);
	let yScale = d3.scaleLinear()
		.domain([yExtent[0] - 1,yExtent[1] + 1])
		.range([height - margin.bottom, margin.top]);

	//Define radius scale
	let rScale = d3.scaleLinear()
		.domain([0,d3.max(data,d => +d['Budget ($million)'])])
		.range([5,25]);

	//Define color scale
	let colorScale = d3.scaleOrdinal()
		.domain(['comedy','sci-fi','fantasy','action','adventure','drama','thriller','horror'])
		.range(['#F9D248','#A7F47B','#A7F47B','#EA963E','#EA963E','#62D9F4','#C992E0','#999999']);

	//Initialize xAxis
	let formatPercent = d3.format('.0%');
	let xAxis = d3.axisBottom()
		.scale(xScale)
		.tickFormat(d => formatPercent(d/100))
		.tickValues([0,15,30,45]);

	//Initialize yAxis
	let yAxis = () => d3.axisLeft()
		.scale(yScale);

	//Append xAxis to svg
	svg.append('g')
		.attr('transform','translate(' + [0,height - margin.bottom] + ')')
		.attr('class','xaxis')
		.call(xAxis);

	//Append yAxis to svg
	svg.append('g')
		.attr('transform','translate(' + [margin.left,0] + ')')
		.attr('class','yaxis')
		.call(yAxis()
			.tickSize(-width) // for grid lines
			.tickFormat(d => d));

	let parentGroup = svg.append('g'); //Group to hold all elements
	let elementGroup = parentGroup.selectAll('g') // each group contains one element(circle + text)
		.data(data)
		.enter()
		.append('g');

	//Append circle to group
	let circle = elementGroup
		.append('circle')
		.attr('cx',(d,i) => {
			if (!groupYear.hasOwnProperty(d['Year'])){
				groupYear[d['Year']] = [];
			}
			return xScale(+d['% gap'])
		})
		.attr('cy',(d) => {
			groupYear[d['Year']] = [...groupYear[d['Year']],{
				cx: xScale(+d['% gap']),
				cy: yScale(d['Year']),
				r: rScale(+d['Budget ($million)'])
			}];
			return yScale(d['Year']);
		})
		.attr('r',(d) => rScale(+d['Budget ($million)']))
		.attr('stroke','white')
		.attr('fill',(d) => {
			let genre = d['Genre'].toLowerCase();
			genre = genre.includes(',') ? genre.slice(0,genre.indexOf(',')) : genre;
			return colorScale(genre);
		})
		.attr('fill-opacity',(d) => {
			let count = 0,opacity = 1;
			for (let i=0;i<groupYear[d['Year']].length;i++){
				if (groupYear[d['Year']][i].cx === xScale(+d['% gap'])){
					count += 1;
				}
			}
			if (count > 2){
				opacity = 0.3;
			}else if (count === 2){
				opacity = 0.5;
			}
			return opacity;
		});

	//Append labels to group
	let labels = elementGroup
		.append('text')
		.text((d) => d['Film'])
		.attr('x',(d) => xScale(+d['% gap']))
		.attr('y',(d) => {
			flag = -flag;
			return (yScale(d['Year']) + (rScale(+d['Budget ($million)']) * flag));
		})
		.attr('text-anchor','middle')
		.attr('font-size',8);
	
	//Remove labels overlaps
	labels.each(function(d,i,g){
		let label = d3.select(g[i])
			.node();
		// d3.select(label).attr('fill',d => {
		// 	return d3.select(this.parentNode).select('circle').attr('fill');
		// })
		let currentlabelBBox = label.getBBox();
		labels.each(function(d,j,g){
			let otherLabel = d3.select(g[j])
					.node();
			if (otherLabel.innerHTML !== label.innerHTML){
				otherLabel = d3.select(g[j])
					.node();
				let otherLabelBBox = otherLabel.getBBox();
					if (isOverlapping(currentlabelBBox,otherLabelBBox)){
						sign = (sign > 0) ? -1 : 1;
						d3.select(label)
							.attr('transform','translate(' + [rScale(+d['Budget ($million)']) * 4,0] + ')');
						d3.select(otherLabel)
							.attr('transform','translate(' + [sign * rScale(+d['Budget ($million)']),5] + ')');
						if (isOverlapping(currentlabelBBox,otherLabelBBox)){
							d3.select(otherLabel)
								.attr('transform','translate(' + [0,sign * 4] + ')');
						}					
				}
			}
		});
	});

	/* // text elements over the circles
	const labelPadding = 2;
	const textLabel = fc.layoutTextLabel()
		.padding(labelPadding)
		.value(d => d['Film']);
	const strategy = fc.layoutRemoveOverlaps(fc.layoutGreedy());
	const labels = fc.layoutLabel(strategy)
		.size((d,i,g) => {
			let textSize = d3.select(g[i])
				.select('text')
				.node()
				.getBBox();
			return([textSize.width,textSize.height]);
		})
		.position(d => [xScale(+d['% gap']), yScale(d['Year']) + 5])
		.component(textLabel);
	
	//render label
	svg
		.datum(data)
		.call(labels); */
});