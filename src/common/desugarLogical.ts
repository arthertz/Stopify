import {NodePath, VisitNode, Visitor} from 'babel-traverse';
import * as t from 'babel-types';
import {letExpression} from '../common/helpers';

export const visitor: Visitor = {
    LogicalExpression(path: NodePath<t.LogicalExpression>) {
        const op = path.node.operator;
        const r = path.scope.generateUidIdentifier(op === "&&" ? "and" : "or");
        const lhs = path.scope.generateUidIdentifier("lhs");
        const stmt = path.getStatementParent();
        stmt.insertBefore(letExpression(lhs, path.node.left));
        stmt.insertBefore(
            t.variableDeclaration("let", [t.variableDeclarator(r)]));

        const x = t.blockStatement([t.expressionStatement(
            t.assignmentExpression("=", r, path.node.right))]);
        const y = t.blockStatement([t.expressionStatement(
            t.assignmentExpression("=", r, lhs))]);

        if (op === "&&") {
            stmt.insertBefore(t.ifStatement(lhs, x, y));
        }
        else {
            stmt.insertBefore(t.ifStatement(lhs, y, x));
        }
        path.replaceWith(r);
    },
    
    ConditionalExpression(path: NodePath<t.ConditionalExpression>) {
        const r = path.scope.generateUidIdentifier("cond");
        const test = path.scope.generateUidIdentifier("test");

        const stmt = path.getStatementParent();
        stmt.insertBefore(
            t.variableDeclaration("let", [t.variableDeclarator(r)]));
        stmt.insertBefore(
            t.variableDeclaration(
                "const",
                [t.variableDeclarator(test, path.node.test)]));
        stmt.insertBefore(
            t.ifStatement(
                test,
                t.blockStatement([
                    t.expressionStatement(
                        t.assignmentExpression("=", r, path.node.consequent))]),
                t.blockStatement([
                    t.expressionStatement(
                        t.assignmentExpression("=", r, path.node.alternate))])
            ));
        path.replaceWith(r);
    }

}
