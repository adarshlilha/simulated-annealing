(function () {
    d3.labeler = function () {
        var labeler = {}, w, h, lab = [], anc = [];

        var max_move = 5.0,
            max_angle = 0.5,
            acc = 0,
            rej = 0;

        //weight
        var weight_label = 30.0,
            weight_label_anc = 30.0,
            weight_len = 0.2;

        energy = function (index) {
            var m = lab.length,
                ener = 0,
                dx = lab[index].x - anc[index].x, //x dist between point and label
                dy = anc[index].y - lab[index].y, //y dist between point and label
                dist = Math.sqrt(dx * dx + dy * dy);

            // penalty for length of leader line
            if (dist > 0) ener += dist * weight_len;

            var x21 = lab[index].x,
                y21 = lab[index].y - lab[index].height + 2.0,
                x22 = lab[index].x + lab[index].width,
                y22 = lab[index].y + 2.0;
            var x11, x12, y11, y12, x_overlap, y_overlap, overlap_area;
            for (var i = 0; i < m; i++) {
                if (i != index) {
                    //label-label overlap
                    //positions of 4 corners of rect bounding the text
                    x11 = lab[i].x,
                    y11 = lab[i].y - lab[i].height + 2.0,
                    x12 = lab[i].x + lab[i].width,
                    y12 = lab[i].y + 2.0;
                    x_overlap = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21));
                    y_overlap = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));
                    overlap_area = x_overlap * y_overlap;
                    ener += (overlap_area * weight_label);
                }
                //label point overlap
                x11 = anc[i].x - anc[i].r; //x start point
                y11 = anc[i].y - anc[i].r; //y start point
                x12 = anc[i].x + anc[i].r; //x end point
                y12 = anc[i].y + anc[i].r; //y end point
                x_overlap = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21));
                y_overlap = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));
                overlap_area = x_overlap * y_overlap;
                ener += (overlap_area * weight_label_anc);
            }
            return ener;
        };
    
        mcmove = function (currTemp) {
            var i = Math.floor(Math.random() * lab.length);

            //save old location of label
            var x_old = lab[i].x;
            var y_old = lab[i].y;

            //old energy
            var old_energy = energy(i);

            //move to a new position
            lab[i].x += (Math.random() - 0.5) * max_move;
            lab[i].y += (Math.random() - 0.5) * max_move;

            if (lab[i].x > w) { lab[i].x = x_old; }
            if (lab[i].x < 0) { lab[i].x = x_old; }
            if (lab[i].y > h) { lab[i].y = y_old; }
            if (lab[i].y < 0) { lab[i].y = y_old; }

            //new energy
            var new_energy = energy(i);
            //change in energy
            var delta_energy = new_energy - old_energy;

            if (Math.random() < Math.exp(-delta_energy / currTemp)) {
                // acc += 1;
                // do nothing, label already at new pos
            } else {
                //go back to the old pos
                lab[i].x = x_old;
                lab[i].y = y_old;
                rej += 1;
            }
        }

        coolingTemp = function (currTemp, initialTemp, nsweeps) {
            return (currTemp - (initialTemp / nsweeps));
        }
        labeler.start = function (nsweeps) {
            //starts simulated annealing
            var m = lab.length,
                currTemp = 1.0,
                initialTemp = 1.0;
            for (var i = 0; i < nsweeps; i++) {
                for (var j = 0; j < m; j++) {
                    mcmove(currTemp);
                }
                currTemp = coolingTemp(currTemp, initialTemp, nsweeps);
            }
        };
        labeler.width = function (x) {
            w = x;
            return labeler;
        };
        labeler.height = function (x) {
            h = x;
            return labeler;
        };
        labeler.label = function (x) {
            lab = x;
            return labeler;
        };
        labeler.anchor = function (x) {
            anc = x;
            return labeler;
        };
        return labeler;
    };
})();