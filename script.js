// Define width, height and margin
let width = 700,height = 700;
let margin = {top:20,right:20,bottom:20,left:40};

//Read csv file and proceed inside callback
d3.csv('https://docs.google.com/spreadsheets/d/e/2PACX-1vS5yUdlq9arfBZ-VhwnvtuxySSonrPDZ1iiY_JwD6X94UIU9Di9BIV63WWVf9DEd-JkDOqCXqtNvqYn/pub?gid=2121555861&single=true&output=csv',(data) => {
	//Initialize and append svg to body
	var svg = d3.select('#root')
		.append('svg')
		.attr('width',width)
		.attr('height',height)
		.style('margin-left','20px');

	//Define scale for x axis
	var xExtent = d3.extent(data,d => +d['% gap']);
	var xScale = d3.scaleLinear()
		.domain([xExtent[0] - 3,xExtent[1] + 3]) //input
		.range([margin.left,width - margin.right]); //output

	//Define scale for y axis
	var yExtent = d3.extent(data,d => +d['Year']);
	var yScale = d3.scaleLinear()
		.domain([yExtent[0] - 1,yExtent[1] + 1])
		.range([height - margin.bottom, margin.top]);

	//Define radius scale
	var rScale = d3.scaleLinear()
		.domain([0,d3.max(data,d => +d['Budget ($million)'])])
		.range([5,25]);

	//Define color scale
	var colorScale = d3.scaleOrdinal()
		.domain(['comedy','sci-fi','fantasy','action','adventure','drama','thriller','horror'])
		.range(['#F9D248','#A7F47B','#A7F47B','#EA963E','#EA963E','#62D9F4','#C992E0','#999999']);

	//Initialize xAxis
	var formatPercent = d3.format('.0%');
	var xAxis = d3.axisBottom()
		.scale(xScale)
		.tickFormat(d => formatPercent(d/100))
		.tickValues([0,15,30,45]);

	//Initialize yAxis
	var yAxis = () => d3.axisLeft()
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

	var parentGroup = svg.append('g');
	var elementGroup = parentGroup.selectAll('g')
		.data(data)
		.enter()
		.append('g');

	var circle = elementGroup
		.append('circle')
		.attr('cx',(d) => xScale(+d['% gap']))
		.attr('cy',(d) => yScale(d['Year']))
		.attr('r',(d) => rScale(+d['Budget ($million)']))
		.attr('stroke','white')
		.attr('fill',(d) => {
			var genre = d['Genre'].toLowerCase();
			genre = genre.includes(',') ? genre.slice(0,genre.indexOf(',')) : genre;
			return colorScale(genre);
		});

	// text elements over the circles
	const labelPadding = 2;
	const textLabel = fc.layoutTextLabel()
		.padding(labelPadding)
		.value(d => d['Film']);
	const strategy = fc.layoutRemoveOverlaps(fc.layoutAnnealing());
	const labels = fc.layoutLabel(strategy)
		.size((d,i,g) => {
			var textSize = d3.select(g[i])
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
		.call(labels);
});