window.onload = () => {
	const container = document.getElementById('container');
	const wrap = document.getElementById('wrap');
	const path = document.getElementById('path');
	const nodeList = document.getElementById('node-list');
	const nodeWidth = 100;
	const nodeHeight = 30;

	//	一般
	const positionData = ((type) => {
		switch (type) {
			case 1:
				return {
					startX: 100, startY: 100,
					endX: 400, endY: 400,
				};
			case 2:
				return {
					startX: 100, startY: 400,
					endX: 400, endY: 100,

				};
			case 3:
				return {
					startX: 200, startY: 100,
					endX: 300, endY: 400,
				};
		}
	})(3);

	const eventPosition = {
		canMove: false,
		target: null,
		//	渲染中——为了提升性能。painting:false 时可以绘制
		painting: false,
		clientX: 0, clientY: 0, offsetX: 0, offsetY: 0,
	};
	//	点击
	const mouseDown = (e) => {
		const { target } = e;
		//	能够移动
		eventPosition.canMove = false;
		if (!target.classList.contains('node')) {
			return;
		}
		console.log(container.scrollLeft);
		console.log(container.scrollTop);
		//	渲染中？
		eventPosition.painting = false;
		const { clientX, clientY, offsetX, offsetY } = e;
		//	计算距离中心点的位置
		//	赋值
		Object.assign(eventPosition, {
			target,
			clientX: clientX + container.scrollLeft,
			clientY: clientY + container.scrollTop,
			offsetY: offsetY - (nodeHeight >> 1),
			offsetX: offsetX - (nodeWidth >> 1),
			canMove: true,
		});
	};
	const mouseMove = (e) => {
		if (!eventPosition.canMove) {
			return;
		}
		//	渲染中
		if (eventPosition.painting) {
			return;
		}
		eventPosition.painting = true;
		requestAnimationFrame(() => {
			eventPosition.painting = false;
		});

		const { clientX, clientY } = e;
		const { offsetX, offsetY, target } = eventPosition;

		//	赋值
		Object.assign(eventPosition, {
			clientX: clientX + container.scrollLeft,
			clientY: clientY + container.scrollTop,
		});
		const nodeType = target.getAttribute('node-type');
		switch (nodeType) {
			case 'start':
				positionData.startX = clientX - offsetX + container.scrollLeft;
				positionData.startY = clientY - offsetY + container.scrollTop;
				break;
			case 'end':
				positionData.endX = clientX - offsetX + container.scrollLeft;
				positionData.endY = clientY - offsetY + container.scrollTop;
				break;
			default:
				throw `nodeType: ${nodeType}`;
		}
		nodeMove(target, eventPosition.clientY - offsetY, eventPosition.clientX - offsetX);
		render();
	};
	const mouseUp = (e) => {
		eventPosition.canMove = false;
		eventPosition.target = null;
		eventPosition.painting = false;
	};

	//	node
	const createNode = (isStart) => {
		const node = document.createElement('div');
		node.classList.add('node');
		node.style.width = `${nodeWidth}px`;
		node.style.height = `${nodeHeight}px`;
		nodeList.appendChild(node);
		node.setAttribute('node-type', isStart ? 'start' : 'end');
		node.innerText = node.getAttribute('node-type');
		return node;
	};
	const nodeMove = (node, top, left) => {
		node.style.top = `${top - (nodeHeight >> 1)}px`;
		node.style.left = `${left - (nodeWidth >> 1)}px`;
	};
	const startNode = createNode(true);
	nodeMove(startNode, positionData.startY, positionData.startX);
	const endNode = createNode(false);
	nodeMove(endNode, positionData.endY, positionData.endX);

	document.addEventListener('mousedown', mouseDown);
	document.addEventListener('mousemove', mouseMove);
	document.addEventListener('mouseup', mouseUp);
	const render = () => {
		//	wrap 的宽高
		//	输入起点和终点，得到贝塞尔曲线
		//	假设，我的 node 块块是 width：100px；height：50px
		((startX, startY, endX, endY) => {

			//	正下方
			const toBottom = endY > startY;
			//	高度
			let wrapHeight = 0;
			let wrapTop = 0;
			//	拐点
			let turningBottom1 = 0;
			let turningBottom2 = 0;
			//	正下方
			if (toBottom) {
				wrapHeight = endY - startY;
				wrapTop = startY - (nodeHeight >> 1);
				//	wrap的高度为，两点之间的高度差 + 2 个 dy
				wrapHeight += nodeHeight;
				//	这里处理当左低右高当情况
				turningBottom1 = nodeHeight >> 1;
				turningBottom2 = wrapHeight - (nodeHeight >> 1);
			} else {
				wrapHeight = startY - endY;
				wrapTop = endY - (nodeHeight >> 1);
				//	wrap的高度为，两点之间的高度差 + 2 个 dy
				wrapHeight += nodeHeight;
				//	这里处理当左低右高当情况
				turningBottom2 = nodeHeight >> 1;
				turningBottom1 = wrapHeight - (nodeHeight >> 1);
			}

			//	最小宽度的左右两侧的额外的值，因为贝塞尔曲线是一个弧，所以理论最小宽度要再加一个额外的值
			const extraWidth = 200 * 2;
			const minWidth = nodeWidth + extraWidth;
			//	正右方
			const toRight = endX >= (startX + minWidth);
			let wrapWidth = 0;
			let wrapLeft = 0;
			//	中心位置 与 【最左侧】 的差距
			let center = 0;
			//	正右方
			if (toRight) {
				wrapWidth = endX - startX;
				wrapLeft = startX;
				center = wrapWidth >> 1;
			} else {
				wrapWidth = Math.abs(endX - startX) + extraWidth;
				wrapWidth = Math.max(minWidth, wrapWidth);
				//	中心位置
				const diffCenter = (endX - startX) >> 1;
				center = diffCenter;
				wrapLeft = endX - diffCenter - (wrapWidth >> 1);
			}

			//	这里处理左右相反的情况
			let turningLeft1 = 0;
			if (toRight) {
//				console.log('%c 正常', 'background:green');
				turningLeft1 = nodeWidth >> 1;
			} else {
//				console.log('%c 左右相反', 'background:red');
				turningLeft1 = (nodeWidth >> 1) + (wrapWidth >> 1) - (center >> 0);
			}
			turningLeft1 -= 1;
			const turningLeft2 = turningLeft1 + 30;
			const turningLeft3 = turningLeft2 + 200;

			//	点
			const m11 = {
				x: turningLeft1,
				y: turningBottom1,
			};
			const m12 = {
				x: turningLeft2,
				y: turningBottom1,
			};
			//	拐点1
			const c1 = {
				x: turningLeft3,
				y: turningBottom1,
			};
			const c2 = {
				x: (wrapWidth) - turningLeft3,
				y: turningBottom2,
			};
			const c3 = {
				x: (wrapWidth) - turningLeft2,
				y: turningBottom2,
			};

			const m21 = c3;

			const m22 = {
				x: (wrapWidth) - (turningLeft1) - 6,
				y: turningBottom2,
			};

			const M1 = `M ${m11.x},${m11.y}  ${m12.x},${m12.y} M ${m12.x},${m12.y}`;
			const C1 = `C ${c1.x},${c1.y}  ${c2.x},${c2.y}  ${c3.x},${c3.y} `;
			const M2 = ` M ${m21.x},${m21.y}  ${m22.x},${m22.y}`;
			const d = M1 + C1 + M2;
			//	渲染
			path.setAttribute('d', d);
			//	宽度
			wrap.style.width = `${wrapWidth}px`;
			//	高度
			wrap.style.height = `${wrapHeight}px`;
			//	位置
			wrap.style.top = `${wrapTop}px`;
			wrap.style.left = `${wrapLeft}px`;

			//	渲染 2
			document.getElementById('d').innerText = d.toString();
			document.getElementById('wrapWidth').innerText = wrapWidth.toString();
			document.getElementById('toRight').innerText = toRight.toString();
			document.getElementById('center').innerText = center.toString();

		})(
			positionData.startX,
			positionData.startY,
			positionData.endX,
			positionData.endY,
		);
	};

	render();

};

